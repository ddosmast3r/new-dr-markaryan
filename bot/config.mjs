import path from 'node:path';
import { defaultVideoDirectory } from '../lib/video-store.mjs';

export function readConfig(env = process.env) {
  const token = env.TELEGRAM_BOT_TOKEN || '';
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) throw new Error('Set TELEGRAM_BOT_TOKEN in the private environment file.');
  const allowedUsers = (env.TELEGRAM_ALLOWED_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  if (allowedUsers.some((id) => !/^[1-9]\d*$/.test(id))) throw new Error('TELEGRAM_ALLOWED_USER_IDS must contain numeric IDs.');
  const api = new URL(env.TELEGRAM_API_URL || 'http://127.0.0.1:8081');
  const cloud = api.origin === 'https://api.telegram.org';
  if (!['http:', 'https:'].includes(api.protocol)) throw new Error('Invalid TELEGRAM_API_URL protocol.');
  if (!cloud && !['127.0.0.1', 'localhost', '[::1]'].includes(api.hostname)) {
    throw new Error('The local Bot API must listen on a loopback address.');
  }
  if (api.username || api.password || api.pathname !== '/' || api.search || api.hash) throw new Error('Invalid TELEGRAM_API_URL.');
  const maxBytes = Number(env.VIDEO_MAX_BYTES || 2_000_000_000);
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('Invalid VIDEO_MAX_BYTES.');
  const remote = env.VIDEO_SITE_SSH_HOST ? {
    host: env.VIDEO_SITE_SSH_HOST, user: env.VIDEO_SITE_SSH_USER || 'drmarkpublish',
    identity: env.VIDEO_SITE_SSH_IDENTITY, knownHosts: env.VIDEO_SITE_SSH_KNOWN_HOSTS,
  } : null;
  if (remote && (!/^[a-zA-Z0-9.-]+$/.test(remote.host) || !/^[a-z_][a-z0-9_-]*$/.test(remote.user)
    || !remote.identity || !path.isAbsolute(remote.identity) || !remote.knownHosts || !path.isAbsolute(remote.knownHosts))) {
    throw new Error('Invalid site publisher SSH configuration.');
  }
  return {
    token, allowedUsers: new Set(allowedUsers), apiUrl: api.origin, cloud,
    apiFilesDirectory: path.resolve(env.TELEGRAM_API_FILES_DIR || '/var/lib/telegram-bot-api'),
    directory: env.VIDEO_DATA_DIR ? path.resolve(env.VIDEO_DATA_DIR) : defaultVideoDirectory(),
    maxBytes: cloud ? Math.min(maxBytes, 20_000_000) : maxBytes,
    publishEnabled: env.VIDEO_PUBLISH_ENABLED !== 'false',
    remote,
    siteUrl: 'https://dr-markaryan.ru',
  };
}
