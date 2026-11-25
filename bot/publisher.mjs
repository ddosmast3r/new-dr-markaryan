import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { videoPages } from '../lib/video-pages.js';

export class SitePublisher {
  constructor(config) { this.config = config; }
  async request(command, { filename, json } = {}) {
    const config = this.config;
    const args = ['-T', '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'ConnectTimeout=10',
      '-o', 'StrictHostKeyChecking=yes', '-o', `UserKnownHostsFile=${config.knownHosts}`, '-i', config.identity,
      `${config.user}@${config.host}`, `edjo-video ${command}`];
    const child = spawn('ssh', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let output = ''; let failed = false;
    child.stdout.on('data', (chunk) => { output += chunk; if (output.length > 65536) child.kill(); });
    child.stderr.resume(); // Never relay remote commands, private paths or key diagnostics to Telegram.
    const completion = new Promise((resolve, reject) => {
      child.on('error', () => reject(new Error('SITE_UNAVAILABLE')));
      child.on('close', (code) => code === 0 && !failed ? resolve() : reject(new Error('SITE_UNAVAILABLE')));
    });
    const timer = setTimeout(() => child.kill(), 30 * 60_000);
    try {
      const input = filename ? pipeline(createReadStream(filename), child.stdin) : new Promise((resolve, reject) => {
        child.stdin.on('error', reject); child.stdin.end(json ? JSON.stringify(json) : '', resolve);
      });
      // Attach both handlers immediately: a failed SSH connection may close stdin first.
      await Promise.all([completion, input.catch(() => { failed = true; throw new Error('SITE_UNAVAILABLE'); })]);
      const result = JSON.parse(output);
      if (!result.ok) throw new Error('SITE_REJECTED');
      return result;
    } finally { clearTimeout(timer); if (child.exitCode === null) child.kill(); }
  }
  async apply(video, directory) {
    const current = await this.request(`inspect ${video.id}`);
    if (video.status === 'published') {
      for (const name of ['video.mp4', 'poster.webp', 'poster-blurred.webp']) {
        const filename = path.join(directory, video.id, name);
        const digest = createHash('sha256');
        for await (const chunk of createReadStream(filename)) digest.update(chunk);
        const sha = digest.digest('hex'); const { size } = await stat(filename);
        if (current.assets[name]?.sha !== sha || current.assets[name]?.size !== size) {
          await this.request(`put ${video.id} ${name} ${size} ${sha}`, { filename });
        }
      }
    }
    const names = ['id', 'status', 'title', 'summary', 'pages', 'sensitive', 'editVersion', 'width', 'height', 'duration', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt', 'publishedAt'];
    const payload = Object.fromEntries(names.map((name) => [name, video[name]]));
    const result = await this.request('apply', { json: payload });
    if (result.revision !== video.editVersion) throw new Error('SITE_REVISION_CONFLICT');
  }
}

export async function publishNext({ store, publisher, config }) {
  const video = store.list().find((item) => item.syncPending && ['published', 'unpublished'].includes(item.status));
  if (!video) return false;
  await publisher.apply(video, config.directory);
  // Commit acknowledgement and its notification together, without overwriting
  // a newer edit made while the media was crossing the network.
  store.db.exec('BEGIN IMMEDIATE');
  try {
    const latest = store.get(video.id);
    if (latest.editVersion === video.editVersion) {
      store.update(video.id, { syncPending: false, syncedEditVersion: video.editVersion });
      const links = [`${config.siteUrl}/video#video-${video.id}`, ...videoPages.filter(({ slug }) => video.pages.includes(slug)).map(({ href }) => `${config.siteUrl}${href}#video-${video.id}`)];
      store.enqueue('sendMessage', { chat_id: video.syncChatId, text: video.status === 'published'
        ? `Видео опубликовано на сайте.\n\n${links.join('\n')}\n\n/videos — управление видео`
        : 'Видео снято со всех страниц сайта. Вернуть его можно через /videos.' });
    }
    store.db.exec('COMMIT');
  } catch (error) { store.db.exec('ROLLBACK'); throw error; }
  return true;
}
