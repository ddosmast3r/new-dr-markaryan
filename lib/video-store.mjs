import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

export const defaultVideoDirectory = () => path.resolve(process.env.VIDEO_DATA_DIR || 'private/video-library');
export const videoIdIsValid = (id) => /^[a-f0-9]{16}$/.test(id);

export class VideoStore {
  constructor(directory = defaultVideoDirectory(), { readonly = false } = {}) {
    this.directory = directory;
    const filename = path.join(directory, 'catalog.sqlite');
    if (readonly && !existsSync(filename)) return;
    if (!readonly) mkdirSync(directory, { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(filename, { readOnly: readonly });
    this.db.exec('PRAGMA busy_timeout = 5000');
    if (!readonly) {
      this.db.exec(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY, data TEXT NOT NULL, version INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions (user_id TEXT PRIMARY KEY, data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, method TEXT NOT NULL, data TEXT NOT NULL);
      `);
    }
  }

  close() { this.db?.close(); }
  get(id) {
    const row = this.db?.prepare('SELECT data, version FROM videos WHERE id = ?').get(id);
    return row ? { ...JSON.parse(row.data), version: row.version } : null;
  }
  list() {
    return this.db ? this.db.prepare('SELECT data, version FROM videos').all()
      .map((row) => ({ ...JSON.parse(row.data), version: row.version })) : [];
  }
  create({ actor, fileId, sourceKey, fileSize, filename, chatId }) {
    // A replayed Telegram update must not enqueue another copy.
    const existing = this.list().find((video) => video.sourceKey === sourceKey);
    if (existing) return existing;
    const id = randomBytes(8).toString('hex');
    const data = {
      id, fileId, sourceKey, fileSize, filename, chatId, createdBy: String(actor), updatedBy: String(actor),
      createdAt: new Date().toISOString(), status: 'queued', title: '', summary: '', pages: [], sensitive: false,
    };
    this.db.prepare('INSERT INTO videos VALUES (?, ?, 1)').run(id, JSON.stringify(data));
    return this.get(id);
  }
  update(id, patch, expectedVersion) {
    const current = this.get(id);
    if (!current) throw new Error('VIDEO_NOT_FOUND');
    const { version, ...data } = current;
    if (expectedVersion !== undefined && version !== expectedVersion) throw new Error('VIDEO_CONFLICT');
    const result = this.db.prepare('UPDATE videos SET data = ?, version = version + 1 WHERE id = ? AND version = ?')
      .run(JSON.stringify({ ...data, ...patch, id }), id, version);
    if (result.changes !== 1) throw new Error('VIDEO_CONFLICT');
    return this.get(id);
  }
  session(userId, data) {
    if (data === undefined) {
      const row = this.db.prepare('SELECT data FROM sessions WHERE user_id = ?').get(String(userId));
      return row ? JSON.parse(row.data) : null;
    }
    if (data === null) this.db.prepare('DELETE FROM sessions WHERE user_id = ?').run(String(userId));
    else this.db.prepare('INSERT OR REPLACE INTO sessions VALUES (?, ?)').run(String(userId), JSON.stringify(data));
  }
  state(key, value) {
    if (value !== undefined) this.db.prepare('INSERT OR REPLACE INTO state VALUES (?, ?)').run(key, String(value));
    return this.db.prepare('SELECT value FROM state WHERE key = ?').get(key)?.value;
  }
  enqueue(method, data) {
    this.db.prepare('INSERT INTO outbox (method, data) VALUES (?, ?)').run(method, JSON.stringify(data));
  }
  nextMessage() {
    const row = this.db.prepare('SELECT * FROM outbox ORDER BY id LIMIT 1').get();
    return row ? { ...row, data: JSON.parse(row.data) } : null;
  }
  acknowledgeMessage(id) { this.db.prepare('DELETE FROM outbox WHERE id = ?').run(id); }
  published(slug) {
    return this.list().filter((video) => video.status === 'published' && (slug === 'video' || video.pages.includes(slug)))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }
}

export function publicVideo(video) {
  return {
    id: video.id, title: video.title, summary: video.summary, width: video.width, height: video.height,
    duration: video.duration, sensitive: video.sensitive,
    warning: video.sensitive ? 'Видео содержит кадры хирургического вмешательства' : undefined,
    src: `/media/videos/${video.id}/video.mp4`, poster: `/media/videos/${video.id}/poster.webp`,
  };
}
