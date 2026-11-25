import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { VideoStore } from '../../lib/video-store.mjs';
import { hasAccess, mintInvite, redeemInvite } from '../access.mjs';
import { VideoBot } from '../controller.mjs';

async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'markaryan-access-'));
  const store = new VideoStore(directory);
  t.after(async () => { store.close(); await rm(directory, { recursive: true, force: true }); });
  return { directory, store, config: { allowedUsers: new Set() } };
}

test('private invitation admits exactly three distinct participants and persists only a hash', async (t) => {
  const f = await fixture(t);
  const token = mintInvite(f.store);
  assert.equal(hasAccess(f.store, f.config, '11'), false);
  assert.equal(redeemInvite(f.store, token, '11'), true);
  assert.equal(redeemInvite(f.store, token, '11'), true);
  assert.equal(redeemInvite(f.store, token, '12'), true);
  assert.equal(redeemInvite(f.store, token, '13'), true);
  assert.equal(redeemInvite(f.store, token, '14'), false);
  assert.equal(redeemInvite(f.store, 'wrong', '14'), false);
  assert.equal(hasAccess(f.store, f.config, '13'), true);
  const records = f.store.db.prepare('SELECT * FROM state').all();
  assert.ok(!JSON.stringify(records).includes(token));
  const reopened = new VideoStore(f.directory);
  try { assert.equal(hasAccess(reopened, f.config, '12'), true); } finally { reopened.close(); }
});

test('expired invitations and replay after revocation cannot grant access', async (t) => {
  const f = await fixture(t);
  const token = mintInvite(f.store);
  const row = f.store.db.prepare("SELECT key,value FROM state WHERE key LIKE 'invite:%'").get();
  f.store.state(row.key, JSON.stringify({ ...JSON.parse(row.value), expiresAt: 0 }));
  assert.equal(redeemInvite(f.store, token, '11'), false);
  const current = mintInvite(f.store);
  assert.equal(redeemInvite(f.store, current, '11'), true);
  f.store.state('access:11', 'revoked');
  assert.equal(redeemInvite(f.store, current, '11'), false);
  assert.equal(hasAccess(f.store, f.config, '11'), false);
});

test('only private Telegram invitation starts open access; ordinary starts remain closed', async (t) => {
  const f = await fixture(t);
  const sent = [];
  const bot = new VideoBot({ ...f, telegram: { send: async (chatId, text) => { sent.push(text); } } });
  const message = (text, type = 'private') => bot.handle({ message: { text, from: { id: 11 }, chat: { id: 11, type } } });
  await message('/start'); assert.match(sent.at(-1), /Доступ.*закрыт/);
  const token = mintInvite(f.store);
  await message(`/start join_${token}`, 'group');
  assert.equal(hasAccess(f.store, f.config, '11'), false);
  await message(`/start join_${token}`);
  assert.equal(hasAccess(f.store, f.config, '11'), true);
  await message('/help'); assert.match(sent.at(-1), /Видеоредактор/);
});
