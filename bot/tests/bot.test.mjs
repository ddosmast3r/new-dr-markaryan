import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { VideoStore, publicVideo } from '../../lib/video-store.mjs';
import { videoPages } from '../../lib/video-pages.js';
import { serveVideoMedia } from '../../lib/video-media.mjs';
import { readConfig } from '../config.mjs';
import { Telegram } from '../telegram.mjs';
import { VideoBot } from '../controller.mjs';
import { processNext, downloadVideo } from '../media.mjs';
import { QueuedTelegram, acceptUpdate, deliverNext } from '../outbox.mjs';

async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'markaryan-bot-'));
  const store = new VideoStore(directory);
  const sent = [];
  const telegram = {
    send: async (chatId, text, keyboard) => { sent.push({ chatId, text, keyboard }); },
    call: async (method, payload) => { sent.push({ method, payload }); return {}; },
  };
  const config = { directory, maxBytes: 2_000_000_000, allowedUsers: new Set(['1', '2', '3']), siteUrl: 'https://example.test' };
  const bot = new VideoBot({ store, telegram, config });
  t.after(async () => { store.close(); await rm(directory, { recursive: true, force: true }); });
  let nextId = 0;
  const message = (userId, body) => bot.handle({ update_id: ++nextId, message: {
    message_id: nextId, chat: { id: userId, type: 'private' }, from: { id: userId }, ...body,
  } });
  const callback = (userId, data) => bot.handle({ callback_query: { id: String(++nextId), from: { id: userId }, data,
    message: { message_id: nextId, chat: { id: userId, type: 'private' } },
  } });
  const action = (userId, command) => callback(userId, `s:${store.session(userId).nonce}:${command}`);
  const document = { file_name: 'original.MOV', file_id: 'telegram-file-id', file_size: 300_000_000 };
  return { directory, store, bot, telegram, config, sent, message, callback, action, document };
}

test('registry contains actual pages, excludes contacts and legal pages; callback lengths fit Telegram', () => {
  assert.ok(videoPages.some((page) => page.slug === 'home'));
  assert.ok(videoPages.some((page) => page.slug === 'kolonoskopiya'));
  assert.equal(new Set(videoPages.map((page) => page.slug)).size, videoPages.length);
  for (const page of videoPages) {
    assert.ok(!['video', 'kontakty', 'privacy', 'license'].includes(page.slug));
    assert.ok(Buffer.byteLength(`s:1234567890:page:${page.slug}`) <= 64);
  }
});

test('access is closed by default; three allowed users can manage videos; only documents accepted', async (t) => {
  const f = await fixture(t);
  await f.message(99, { document: f.document });
  assert.equal(f.store.list().length, 0);
  await f.message(99, { text: '/id' });
  assert.match(f.sent.at(-1).text, /99/);
  for (const userId of [1, 2, 3]) {
    await f.message(userId, { video: { file_id: 'x' } });
    assert.match(f.sent.at(-1).text, /документом/);
    await f.message(userId, { document: f.document });
    assert.equal(f.store.session(userId).step, 'title');
  }
  assert.equal(f.store.list().length, 3);
  f.config.allowedUsers.clear();
  await f.message(1, { text: 'Cannot edit' });
  assert.equal(f.store.session(1).fields.title, '');
});

test('full workflow: original document, multiple pages, preview, publish, edit and unpublish', async (t) => {
  const f = await fixture(t);
  await f.message(1, { document: f.document });
  const id = f.store.session(1).videoId;
  await f.message(1, { text: 'Подготовка к осмотру' });
  await f.message(1, { text: 'Короткое описание' });
  await f.action(1, 'page:home');
  await f.action(1, 'page:kolonoskopiya');
  await f.action(1, 'page:home');
  await f.action(1, 'page:home');
  await f.action(1, 'done');
  await f.action(1, 'yes');
  assert.equal(f.store.session(1).step, 'preview');
  assert.deepEqual(f.store.get(id).pages, ['kolonoskopiya', 'home']);
  await f.action(1, 'publish');
  assert.equal(f.store.get(id).status, 'queued');
  f.store.update(id, { status: 'ready', width: 608, height: 1080, duration: 14 });
  await f.action(1, 'publish');
  assert.equal(f.store.get(id).status, 'published');
  assert.equal(f.store.published('home').length, 1);
  assert.equal(f.store.published('video').length, 1);
  assert.equal(f.store.published('gastroskopiya').length, 0);
  assert.match(f.sent.at(-1).text, new RegExp(`/video#video-${id}`));
  assert.match(f.sent.at(-1).text, new RegExp(`/kolonoskopiya#video-${id}`));
  assert.equal(publicVideo(f.store.get(id)).fileId, undefined);
  await f.callback(2, `open:${id}`);
  await f.action(2, 'title');
  await f.message(2, { text: 'Новое название' });
  assert.equal(f.store.get(id).title, 'Подготовка к осмотру');
  await f.action(2, 'publish');
  assert.equal(f.store.get(id).title, 'Новое название');
  assert.equal(f.store.get(id).createdBy, '1');
  assert.equal(f.store.get(id).updatedBy, '2');
  await f.callback(3, `open:${id}`);
  await f.action(3, 'unpublish');
  assert.equal(f.store.get(id).status, 'published');
  await f.action(3, 'hide');
  assert.equal(f.store.published('video').length, 0);
  assert.equal(f.store.published('home').length, 0);
  await f.action(3, 'publish');
  assert.equal(f.store.published('home').length, 1);
});

test('stale callbacks, repeated documents and simultaneous edits cannot duplicate or overwrite publications', async (t) => {
  const f = await fixture(t);
  const update = { message: { message_id: 123, chat: { id: 1, type: 'private' }, from: { id: 1 }, document: f.document } };
  await f.bot.handle(update); await f.bot.handle(update);
  assert.equal(f.store.list().length, 1);
  const id = f.store.list()[0].id;
  f.store.update(id, { status: 'published', title: 'Original', editVersion: 1, publishedAt: new Date().toISOString() });
  f.store.session(1, null);
  await f.callback(1, `open:${id}`); await f.callback(2, `open:${id}`);
  const old = f.store.session(1).nonce;
  await f.action(1, 'title'); await f.message(1, { text: 'First edit' }); await f.action(1, 'publish');
  await f.action(2, 'title'); await f.message(2, { text: 'Second edit' }); await f.action(2, 'publish');
  assert.equal(f.store.get(id).title, 'First edit');
  assert.match(f.sent.at(-1).text, /Другой участник/);
  await f.callback(1, `s:${old}:publish`);
  assert.equal(f.store.list().length, 1);
  assert.match(f.sent.at(-1).text, /устарела/);
});

test('draft metadata and conversation state survive reopening the SQLite database', async (t) => {
  const f = await fixture(t);
  await f.message(1, { document: f.document }); await f.message(1, { text: 'Saved draft' });
  const second = new VideoStore(f.directory);
  try {
    assert.equal(second.session(1).step, 'summary');
    assert.equal(second.get(second.session(1).videoId).title, 'Saved draft');
  } finally { second.close(); }
});

test('disconnected publishing mode cannot announce a publication or expose a local draft', async (t) => {
  const f = await fixture(t);
  await f.message(1, { document: f.document });
  const id = f.store.session(1).videoId;
  f.store.update(id, { status: 'ready', title: 'Local only' });
  f.store.session(1, null);
  await f.callback(1, `open:${id}`);
  f.config.publishEnabled = false;
  await f.action(1, 'publish');
  assert.equal(f.store.get(id).status, 'ready');
  assert.match(f.sent.at(-1).text, /не подключена/);
  assert.equal(f.store.published('video').length, 0);
});

test('remote mode queues publication and removal without reporting premature success', async (t) => {
  const f = await fixture(t);
  await f.message(1, { document: f.document });
  const id = f.store.session(1).videoId;
  f.store.update(id, { status: 'ready', title: 'Remote' });
  f.store.session(1, null);
  await f.callback(1, `open:${id}`);
  f.config.remote = { host: 'example.test' };
  await f.action(1, 'publish');
  assert.equal(f.store.get(id).syncPending, true);
  assert.match(f.sent.at(-1).text, /Передаю/);
  assert.ok(!f.sent.at(-1).text.includes('https://'));
  await f.callback(1, `open:${id}`);
  await f.action(1, 'unpublish'); await f.action(1, 'hide');
  assert.equal(f.store.get(id).status, 'unpublished');
  assert.equal(f.store.get(id).syncPending, true);
  assert.match(f.sent.at(-1).text, /Передаю/);
});

test('worker succeeds, preserves metadata; failed job stays private and can retry', async (t) => {
  const f = await fixture(t);
  await f.message(1, { document: f.document });
  const id = f.store.session(1).videoId;
  await f.message(1, { text: 'Draft' });
  const deps = { store: f.store, telegram: f.telegram, config: f.config,
    download: async (video, source) => { await writeFile(source, 'video'); },
    encode: async () => ({ width: 100, height: 200, duration: 4 }),
  };
  assert.equal(await processNext({ ...deps, encode: async () => { throw new Error('bad media'); } }), true);
  assert.equal(f.store.get(id).status, 'failed');
  assert.equal(f.store.published('video').length, 0);
  f.store.update(id, { status: 'queued' });
  assert.equal(await processNext(deps), true);
  assert.equal(f.store.get(id).status, 'ready');
  assert.equal(f.store.get(id).title, 'Draft');
  assert.equal(await processNext(deps), false);
});

test('public media guards draft files, sensitive covers, byte ranges and unpublication', async (t) => {
  const f = await fixture(t);
  const video = f.store.create({ actor: '1', sourceKey: 'key', fileId: 'x', filename: 'x.mp4', fileSize: 10, chatId: 1 });
  const directory = path.join(f.directory, video.id);
  await mkdir(directory);
  await writeFile(path.join(directory, 'video.mp4'), '0123456789');
  await writeFile(path.join(directory, 'poster.webp'), 'normal');
  await writeFile(path.join(directory, 'poster-blurred.webp'), 'blurred');
  const request = (asset = 'video.mp4', headers = {}, method = 'GET') => serveVideoMedia(new Request('http://localhost/media', { headers, method }), { id: video.id, asset }, f.directory);
  assert.equal((await request()).status, 404);
  f.store.update(video.id, { status: 'published', sensitive: true });
  const whole = await request();
  assert.equal(await whole.text(), '0123456789');
  assert.equal(whole.headers.get('cache-control'), 'private, no-store');
  const range = await request('video.mp4', { Range: 'bytes=2-4' });
  assert.equal(range.status, 206); assert.equal(await range.text(), '234');
  assert.equal(range.headers.get('content-range'), 'bytes 2-4/10');
  assert.equal(await (await request('video.mp4', { Range: 'bytes=-3' })).text(), '789');
  assert.equal((await request('video.mp4', { Range: 'bytes=10-' })).status, 416);
  assert.equal((await request('video.mp4', { Range: 'bytes=0-1,3-4' })).status, 416);
  const head = await request('video.mp4', {}, 'HEAD');
  assert.equal(head.headers.get('content-length'), '10'); assert.equal(await head.text(), '');
  assert.equal(await (await request('poster.webp')).text(), 'blurred');
  for (const name of ['preview.jpg', 'source', '../catalog.sqlite', 'poster-blurred.webp']) assert.equal((await request(name)).status, 404);
  f.store.update(video.id, { status: 'unpublished' });
  assert.equal((await request()).status, 404);
  assert.equal((await request('poster.webp')).status, 404);
});

test('local downloads reject paths outside the API root, including symlink escapes', async (t) => {
  const f = await fixture(t);
  const apiDirectory = path.join(f.directory, 'api'); await mkdir(apiDirectory);
  const outside = path.join(f.directory, 'outside'); await writeFile(outside, 'private');
  const telegram = { call: async () => ({ file_path: outside }) };
  await assert.rejects(downloadVideo({ fileId: 'x', fileSize: 7 }, path.join(f.directory, 'copy'), telegram,
    { ...f.config, cloud: false, apiFilesDirectory: apiDirectory }), /INVALID_FILE_PATH/);
  const escaped = path.join(apiDirectory, 'escape'); await symlink(outside, escaped);
  await assert.rejects(downloadVideo({ fileId: 'x', fileSize: 7 }, path.join(f.directory, 'copy'),
    { call: async () => ({ file_path: escaped }) }, { ...f.config, cloud: false, apiFilesDirectory: apiDirectory }), /INVALID_FILE_PATH/);
  const original = path.join(apiDirectory, 'original'); await writeFile(original, '1234567');
  await downloadVideo({ fileId: 'x', fileSize: 7 }, path.join(f.directory, 'copy'),
    { call: async () => ({ file_path: original }) }, { ...f.config, cloud: false, apiFilesDirectory: apiDirectory });
  await assert.rejects(downloadVideo({ fileId: 'x', fileSize: 7 }, path.join(f.directory, 'copy'),
    { call: async () => ({ file_path: original }) }, { ...f.config, maxBytes: 2, cloud: false, apiFilesDirectory: apiDirectory }), /FILE_TOO_LARGE/);
});

test('configuration supports many users and rejects unsafe endpoints; API failures redact tokens', async () => {
  const env = { TELEGRAM_BOT_TOKEN: '123:test-token', TELEGRAM_ALLOWED_USER_IDS: '1,2,3,4' };
  assert.equal(readConfig(env).allowedUsers.size, 4);
  assert.equal(readConfig({ ...env, TELEGRAM_ALLOWED_USER_IDS: '' }).allowedUsers.size, 0);
  assert.equal(readConfig({ ...env, TELEGRAM_API_URL: 'https://api.telegram.org' }).maxBytes, 20_000_000);
  assert.throws(() => readConfig({ ...env, TELEGRAM_API_URL: 'http://example.test:8081' }));
  assert.throws(() => readConfig({ ...env, TELEGRAM_ALLOWED_USER_IDS: 'username' }));
  const telegram = new Telegram(readConfig(env), async () => { throw new Error('https://secret-url/123:test-token'); });
  await assert.rejects(telegram.call('getMe'), (error) => error.message === 'TELEGRAM_UNAVAILABLE');
});

test('network outage retries queued responses without replaying wizard input; update rollback is atomic', async (t) => {
  const f = await fixture(t);
  const bot = new VideoBot({ store: f.store, telegram: new QueuedTelegram(f.store), config: f.config });
  const envelope = (update_id, body) => ({ update_id, message: { message_id: update_id, chat: { id: 1, type: 'private' }, from: { id: 1 }, ...body } });
  await acceptUpdate(f.store, bot, envelope(1, { document: f.document }));
  const update = envelope(2, { text: 'One title' });
  await acceptUpdate(f.store, bot, update);
  assert.equal(f.store.session(1).step, 'summary');
  const queued = f.store.nextMessage();
  await assert.rejects(deliverNext(f.store, { call: async () => { throw new Error('TELEGRAM_UNAVAILABLE'); } }));
  assert.equal(f.store.nextMessage().id, queued.id);
  await acceptUpdate(f.store, bot, update);
  assert.equal(f.store.session(1).step, 'summary');
  assert.equal(f.store.session(1).fields.summary, '');
  await deliverNext(f.store, f.telegram);
  assert.notEqual(f.store.nextMessage()?.id, queued.id);
  await assert.rejects(acceptUpdate(f.store, { handle: async () => { f.store.state('partial', 'bad'); throw new Error('failure'); } }, envelope(3, { text: 'x' })));
  assert.equal(f.store.state('partial'), undefined);
  assert.equal(f.store.state('telegram_offset'), '3');
});
