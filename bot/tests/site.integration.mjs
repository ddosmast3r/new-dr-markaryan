import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import os from 'node:os';
import path from 'node:path';
import { VideoStore } from '../../lib/video-store.mjs';
import { videoPages } from '../../lib/video-pages.js';

// Run after check:build. All publication writes go to an isolated temporary DB.
const directory = await mkdtemp(path.join(os.tmpdir(), 'markaryan-site-'));
const store = new VideoStore(directory);
let child;
try {
  child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '0'], {
    env: { ...process.env, VIDEO_DATA_DIR: directory, NEXT_DIST_DIR: '.next-check' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  let base;
  for (let i = 0; i < 100; i++) {
    base = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
    if (base && output.includes('Ready')) break;
    if (child.exitCode !== null) throw new Error(output);
    await delay(100);
  }
  assert.ok(base, 'Next.js must start');
  const video = store.create({ actor: 'test', fileId: 'private-file-id', sourceKey: 'smoke', filename: 'test.mp4', fileSize: 10, chatId: 1 });
  await mkdir(path.join(directory, video.id));
  await writeFile(path.join(directory, video.id, 'video.mp4'), '0123456789');
  await writeFile(path.join(directory, video.id, 'poster.webp'), 'normal');
  await writeFile(path.join(directory, video.id, 'poster-blurred.webp'), 'blurred');
  const marker = `video-${video.id}`;
  assert.equal((await fetch(`${base}/media/videos/${video.id}/video.mp4`)).status, 404);
  assert.ok(!(await (await fetch(`${base}/video`)).text()).includes(marker), 'draft absent from SSR');
  store.update(video.id, { status: 'published', title: 'Publication smoke test', pages: videoPages.map((page) => page.slug),
    duration: 12, width: 640, height: 1080, publishedAt: new Date().toISOString() });
  for (const href of ['/video', ...videoPages.map((page) => page.href)]) {
    const response = await fetch(`${base}${href}`);
    assert.equal(response.status, 200, href);
    const html = await response.text();
    assert.equal(html.split(`id="${marker}"`).length - 1, 1, `${href}: exactly one video card`);
    assert.ok(!html.includes('private-file-id'), 'Telegram source identifiers stay server-side');
  }
  const range = await fetch(`${base}/media/videos/${video.id}/video.mp4`, { headers: { Range: 'bytes=2-4' } });
  assert.equal(range.status, 206); assert.equal(await range.text(), '234');
  store.update(video.id, { title: 'Updated smoke title', pages: ['home'], sensitive: true });
  assert.ok((await (await fetch(`${base}/`)).text()).includes('Updated smoke title'));
  assert.ok(!(await (await fetch(`${base}/kolonoskopiya`)).text()).includes(marker), 'placement removal applies without rebuild');
  assert.equal(await (await fetch(`${base}/media/videos/${video.id}/poster.webp`)).text(), 'blurred');
  store.update(video.id, { status: 'unpublished' });
  assert.ok(!(await (await fetch(`${base}/video`)).text()).includes(marker));
  assert.ok(!(await (await fetch(`${base}/`)).text()).includes(marker));
  assert.equal((await fetch(`${base}/media/videos/${video.id}/video.mp4`)).status, 404);
  console.log(`Website integration passed: ${videoPages.length + 1} pages, live updates, ranges, private drafts, unpublication.`);
} finally {
  if (child && child.exitCode === null) {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
  }
  store.close();
  await rm(directory, { recursive: true, force: true });
}
