import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { encodeVideo, probe } from '../media.mjs';

const execute = promisify(execFile);
test('real FFmpeg produces browser video, dimensions, duration and three covers; rejects invalid content', async (t) => {
  try { await execute('ffmpeg', ['-version']); await execute('ffprobe', ['-version']); }
  catch (error) {
    if (error.code === 'ENOENT') { t.skip('FFmpeg/ffprobe are not installed'); return; }
    throw error;
  }
  const directory = await mkdtemp(path.join(os.tmpdir(), 'markaryan-encode-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const source = path.join(directory, 'original.mov');
  await execute('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=120x200:rate=10',
    '-f', 'lavfi', '-i', 'sine=frequency=440', '-t', '1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', source]);
  const result = await encodeVideo(source, directory);
  assert.ok(result.width <= 1080 && result.height <= 1080);
  assert.equal(result.width, 120, 'small inputs must not be upscaled');
  assert.equal(result.height, 200);
  assert.ok(result.height > result.width);
  assert.ok(result.duration > 0);
  for (const asset of ['video.mp4', 'poster.webp', 'poster-blurred.webp', 'preview.jpg']) {
    assert.ok((await readFile(path.join(directory, asset))).length > 0);
  }
  const broken = path.join(directory, 'broken.mp4'); await writeFile(broken, 'not video');
  await assert.rejects(probe(broken));
});
