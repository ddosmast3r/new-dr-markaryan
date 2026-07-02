import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const URL = process.env.DEMO_URL || 'http://localhost:3200/';
const VIEW = { width: 1440, height: 810 };
const OUT_DIR = '/tmp/demo-rec';

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEW,
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT_DIR, size: VIEW },
});
const page = await context.newPage();

await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(3500); // let it hydrate + hold on hero

// Show the booking modal (click the big hero CTA)
try {
  await page.locator('.hero-actions button').first().click({ timeout: 5000 });
  await page.waitForSelector('.modal.open', { timeout: 4000 });
  await page.waitForTimeout(2200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
} catch (e) {
  console.log('modal step skipped:', e.message);
}

// Guided section-by-section tour: glide to each block, then hold.
async function glideTo(y, dur = 1300) {
  await page.evaluate(
    ({ y, dur }) =>
      new Promise((res) => {
        const from = window.scrollY;
        const start = performance.now();
        const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        const step = (now) => {
          const p = Math.min(1, (now - start) / dur);
          window.scrollTo(0, from + (y - from) * ease(p));
          if (p < 1) requestAnimationFrame(step);
          else res();
        };
        requestAnimationFrame(step);
      }),
    { y, dur }
  );
}

async function visit(sel, hold = 1800) {
  const y = await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    return window.scrollY + el.getBoundingClientRect().top - 72;
  }, sel);
  if (y === null) return;
  await glideTo(y);
  await page.waitForTimeout(hold);
}

for (const sel of ['#about', '#services', '#diagnostics', '#how', '#instagram', '#reviews', '#contacts']) {
  await visit(sel);
}
// settle on the footer
await glideTo(await page.evaluate(() => document.body.scrollHeight), 1500);
await page.waitForTimeout(2000);

await context.close(); // finalizes the .webm
await browser.close();

const file = fs.readdirSync(OUT_DIR).find((f) => f.endsWith('.webm'));
const webm = `${OUT_DIR}/${file}`;
const mp4 = `${os.homedir()}/Desktop/dr-markaryan-demo.mp4`;

// Convert to a QuickTime-friendly mp4 right next on the Desktop.
try {
  execFileSync('ffmpeg', ['-y', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart', mp4], { stdio: 'ignore' });
  console.log('Готово:', mp4);
} catch {
  console.log('WEBM записан:', webm, '(ffmpeg не сработал, конвертируйте вручную)');
}
