// One-time asset preparation. Requires ffmpeg; production does not.
// Full-length, silent copies for the blurred background only. Original videos
// used by the player remain untouched, with their original quality and sound.
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const output = 'public/video/hero';
await fs.mkdir(output, { recursive: true });
for (const [source, name] of [
  ['public/inst/reel5.mp4', 'reel5'],
  ['public/video/endoscope-wash-2.mp4', 'endoscope-wash-2'],
  ['public/inst/reel2.mp4', 'reel2'],
  ['public/inst/reel1.mp4', 'reel1'],
]) {
  const target = `${output}/${name}.mp4`;
  const result = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', source,
    '-map', '0:v:0', '-an', '-vf', 'scale=-2:640,fps=24',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '28',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', target,
  ], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`ffmpeg failed for ${source}`);
  console.log(`${target}: ${(await fs.stat(target)).size} bytes`);
}
