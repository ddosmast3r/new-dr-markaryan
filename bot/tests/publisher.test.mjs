import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VideoStore } from '../../lib/video-store.mjs';
import { SitePublisher, publishNext } from '../publisher.mjs';

const receiverFile = fileURLToPath(new URL('../site-receiver.py', import.meta.url));
async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'markaryan-publisher-'));
  const local = path.join(directory, 'local'); const remote = path.join(directory, 'site');
  const pages = path.join(directory, 'pages.json'); await writeFile(pages, JSON.stringify(['home', 'kolonoskopiya']));
  const store = new VideoStore(local);
  t.after(async () => { store.close(); await rm(directory, { recursive: true, force: true }); });
  const receive = (command, input = Buffer.alloc(0)) => new Promise((resolve, reject) => {
    const child = spawn('python3', [receiverFile], { env: { ...process.env, VIDEO_DATA_DIR: remote, VIDEO_PAGES_FILE: pages, SSH_ORIGINAL_COMMAND: command } });
    let output = ''; child.stdout.on('data', (chunk) => { output += chunk; }); child.stderr.resume();
    child.on('error', reject); child.on('close', (code) => code === 0 ? resolve(JSON.parse(output)) : reject(new Error('REJECTED')));
    child.stdin.on('error', () => {}); child.stdin.end(input);
  });
  const publisher = new SitePublisher({});
  publisher.request = async (command, { filename, json } = {}) => receive(`edjo-video ${command}`, filename ? await readFile(filename) : json ? JSON.stringify(json) : undefined);
  const video = store.create({ actor: '1', fileId: 'private', sourceKey: 'fixture', fileSize: 5, filename: 'x.mp4', chatId: 1 });
  await mkdir(path.join(local, video.id));
  for (const asset of ['video.mp4', 'poster.webp', 'poster-blurred.webp']) await writeFile(path.join(local, video.id, asset), 'asset');
  const now = new Date().toISOString();
  store.update(video.id, { status: 'published', title: 'Ready', summary: 'Summary', pages: ['home', 'kolonoskopiya'],
    sensitive: true, width: 120, height: 200, duration: 1, updatedAt: now, publishedAt: now, editVersion: 1, syncPending: true, syncChatId: 1 });
  return { directory, local, remote, store, publisher, receive, id: video.id, config: { directory: local, siteUrl: 'https://example.test' } };
}

test('SSH receiver accepts only its protocol and validates metadata, hashes and file boundaries', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.receive('edjo-video health')).protocol, 1);
  await assert.rejects(f.receive('cat /etc/passwd'));
  await assert.rejects(f.receive('edjo-video inspect ../../escape'));
  await assert.rejects(f.receive(`edjo-video put ${f.id} ../escape 5 ${'a'.repeat(64)}`, 'asset'));
  await assert.rejects(f.receive(`edjo-video put ${f.id} video.mp4 5 ${'a'.repeat(64)}`, 'asset'));
  await assert.rejects(f.receive(`edjo-video put ${f.id} video.mp4 20 ${'a'.repeat(64)}`, 'short'));
  await assert.rejects(f.publisher.request('apply', { json: f.store.get(f.id) }), 'cannot publish missing media');
  await f.publisher.apply(f.store.get(f.id), f.local);
  await assert.rejects(f.publisher.request('apply', { json: { ...f.store.get(f.id), editVersion: 2, pages: ['privacy'] } }));
});

test('remote publication uploads media, confirms revision, sends success only after ack, supports edits and removal', async (t) => {
  const f = await fixture(t);
  assert.equal(f.store.nextMessage(), null);
  await publishNext({ store: f.store, publisher: f.publisher, config: f.config });
  assert.equal(f.store.get(f.id).syncPending, false);
  assert.match(f.store.nextMessage().data.text, /Видео опубликовано на сайте/);
  const readSite = () => { const site = new VideoStore(f.remote, { readonly: true }); try { return site.get(f.id); } finally { site.close(); } };
  assert.equal(readSite().title, 'Ready'); assert.equal(readSite().fileId, undefined);
  await f.publisher.apply(f.store.get(f.id), f.local); // Lost SSH acknowledgement can be replayed.
  f.store.update(f.id, { title: 'Edited', editVersion: 2, syncPending: true });
  await publishNext({ store: f.store, publisher: f.publisher, config: f.config });
  assert.equal(readSite().title, 'Edited');
  f.store.update(f.id, { status: 'unpublished', editVersion: 3, syncPending: true });
  await publishNext({ store: f.store, publisher: f.publisher, config: f.config });
  assert.equal(readSite().status, 'unpublished');
  await f.publisher.apply({ ...f.store.get(f.id), status: 'published', editVersion: 1 }, f.local).catch(() => {});
  assert.equal(readSite().status, 'unpublished', 'old publication cannot undo a later removal');
});

test('network failure preserves queued publication; concurrent edits require their own acknowledgement', async (t) => {
  const f = await fixture(t);
  await assert.rejects(publishNext({ store: f.store, publisher: { apply: async () => { throw new Error('offline'); } }, config: f.config }));
  assert.equal(f.store.get(f.id).syncPending, true); assert.equal(f.store.nextMessage(), null);
  await publishNext({ store: f.store, publisher: { apply: async () => { f.store.update(f.id, { title: 'Newer', editVersion: 2 }); } }, config: f.config });
  assert.equal(f.store.get(f.id).syncPending, true); assert.equal(f.store.nextMessage(), null);
  await publishNext({ store: f.store, publisher: f.publisher, config: f.config });
  assert.equal(f.store.get(f.id).syncedEditVersion, 2);
});
