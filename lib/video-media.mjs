import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import path from 'node:path';
import { VideoStore, defaultVideoDirectory, videoIdIsValid } from './video-store.mjs';

// Kept separate from the Next route so access and range behavior can be tested.
export async function serveVideoMedia(request, { id, asset }, directory = defaultVideoDirectory()) {
  const privateHeaders = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
  const missing = () => new Response(null, { status: 404, headers: privateHeaders });
  if (!videoIdIsValid(id) || !['video.mp4', 'poster.webp'].includes(asset)) return missing();
  const store = new VideoStore(directory, { readonly: true });
  let video;
  try { video = store.get(id); } finally { store.close(); }
  if (video?.status !== 'published') return missing();
  const filename = path.join(directory, id, asset === 'poster.webp' && video.sensitive ? 'poster-blurred.webp' : asset);
  let size;
  try { size = (await stat(filename)).size; } catch { return missing(); }
  let start = 0; let end = size - 1; let status = 200;
  const headers = { ...privateHeaders, 'Accept-Ranges': 'bytes', 'Content-Type': asset === 'video.mp4' ? 'video/mp4' : 'image/webp' };
  const range = request.headers.get('range');
  if (range) {
    const invalidRange = () => new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${size}` } });
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return invalidRange();
    if (match[1]) { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1; }
    else { const suffix = Number(match[2]); if (!Number.isSafeInteger(suffix) || suffix <= 0) return invalidRange(); start = Math.max(0, size - suffix); }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) return invalidRange();
    status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
  }
  headers['Content-Length'] = String(end - start + 1);
  if (request.method === 'HEAD') return new Response(null, { status, headers });
  return new Response(Readable.toWeb(createReadStream(filename, { start, end })), { status, headers });
}
