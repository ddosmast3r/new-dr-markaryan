import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, realpath, rm, statfs } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import sharp from 'sharp';

const execute = promisify(execFile);
const options = { timeout: 30 * 60_000, maxBuffer: 1024 * 1024, env: { PATH: process.env.PATH, LANG: 'C' } };

export async function probe(filename) {
  const { stdout } = await execute('ffprobe', ['-v', 'error', '-protocol_whitelist', 'file,pipe', '-show_streams', '-show_format', '-of', 'json', filename], { ...options, timeout: 30_000 });
  const metadata = JSON.parse(stdout);
  const stream = metadata.streams?.find((item) => item.codec_type === 'video');
  const duration = Number(metadata.format?.duration || stream?.duration);
  if (!stream || !Number.isFinite(duration) || duration <= 0 || duration > 7200 || !stream.width || !stream.height || stream.width > 8192 || stream.height > 8192) {
    throw new Error('INVALID_VIDEO');
  }
  return { width: stream.width, height: stream.height, duration };
}

export async function encodeVideo(source, directory) {
  await probe(source);
  const output = path.join(directory, 'video.mp4');
  await execute('ffmpeg', ['-nostdin', '-v', 'error', '-y', '-protocol_whitelist', 'file,pipe', '-i', source,
    '-map', '0:v:0', '-map', '0:a:0?', '-map_metadata', '-1', '-vf', "scale=w='min(1080,iw)':h='min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
    '-r', '30', '-c:v', 'libx264', '-threads', '1', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', output], options);
  const metadata = await probe(output);
  const coverArgs = ['-nostdin', '-v', 'error', '-y', '-ss', String(Math.min(0.5, metadata.duration / 2)), '-i', output, '-frames:v', '1', '-threads', '1'];
  const preview = path.join(directory, 'preview.jpg');
  await execute('ffmpeg', [...coverArgs, '-vf', 'scale=640:-2', preview], options);
  await sharp(preview).webp({ quality: 80 }).toFile(path.join(directory, 'poster.webp'));
  await sharp(preview).blur(30).webp({ quality: 70 }).toFile(path.join(directory, 'poster-blurred.webp'));
  return metadata;
}

export async function downloadVideo(video, destination, telegram, config) {
  const file = await telegram.call('getFile', { file_id: video.fileId });
  let source;
  if (config.cloud) {
    if (!file.file_path || file.file_path.includes('..') || !/^[\w/.-]+$/.test(file.file_path)) throw new Error('INVALID_FILE_PATH');
    let response;
    try {
      response = await fetch(`${config.apiUrl}/file/bot${config.token}/${file.file_path}`, { signal: AbortSignal.timeout(10 * 60_000) });
    } catch { throw new Error('DOWNLOAD_FAILED'); }
    if (!response.ok || !response.body) throw new Error('DOWNLOAD_FAILED');
    source = Readable.fromWeb(response.body);
  } else {
    const [root, filename] = await Promise.all([realpath(config.apiFilesDirectory), realpath(file.file_path)]);
    if (!filename.startsWith(root + path.sep)) throw new Error('INVALID_FILE_PATH');
    source = createReadStream(filename);
  }
  let bytes = 0;
  const limiter = new Transform({ transform(chunk, encoding, callback) {
    bytes += chunk.length;
    if (bytes > config.maxBytes) callback(new Error('FILE_TOO_LARGE'));
    else callback(null, chunk);
  } });
  await pipeline(source, limiter, createWriteStream(destination, { mode: 0o600 }));
  if (!bytes || bytes !== video.fileSize) throw new Error('INCOMPLETE_FILE');
}

export async function processNext({ store, telegram, config, download = downloadVideo, encode = encodeVideo }) {
  const video = store.list().find((item) => item.status === 'queued');
  if (!video) return false;
  store.update(video.id, { status: 'processing' }, video.version);
  const directory = path.join(config.directory, video.id);
  const source = path.join(directory, 'source');
  try {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const disk = await statfs(directory);
    if (disk.bavail * disk.bsize < video.fileSize * 2 + 128_000_000) throw new Error('DISK_FULL');
    await download(video, source, telegram, config);
    const metadata = await encode(source, directory);
    store.update(video.id, { ...metadata, status: 'ready' });
    await telegram.send(video.chatId, 'Видео обработано, обложка готова. /continue — продолжить текущий черновик, /videos — открыть список.').catch(() => {});
  } catch {
    // Do not log provider errors: a local API path may contain the token.
    store.update(video.id, { status: 'failed' });
    await telegram.send(video.chatId, 'Не удалось обработать видео. Черновик сохранён. Откройте его через /videos и нажмите «Повторить обработку».').catch(() => {});
  } finally {
    await rm(source, { force: true }).catch(() => {});
  }
  return true;
}
