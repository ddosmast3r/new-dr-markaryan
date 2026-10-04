import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium, webkit } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const next = require.resolve('next/dist/bin/next');
const children = new Set();
let interrupted = false;

function signalChild(child, signal) {
  if (child.exitCode !== null || child.signalCode !== null || !child.pid) return;
  try {
    // Stop this check's process group, never an existing preview server.
    if (process.platform === 'win32') child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

function start(args, env = {}) {
  if (interrupted) throw new Error('Проверка прервана.');
  const child = spawn(process.execPath, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    detached: process.platform !== 'win32',
  });
  children.add(child);
  // Resolve on errors as well, so a server exiting early never leaves an
  // unhandled rejected promise while the readiness request is pending.
  child.done = new Promise(resolve => {
    child.once('error', error => resolve({ error }));
    child.once('exit', (code, signal) => resolve({ code, signal }));
  }).finally(() => children.delete(child));
  return child;
}

async function stop(child) {
  signalChild(child, 'SIGTERM');
  const timer = setTimeout(() => signalChild(child, 'SIGKILL'), 5000);
  try { await child.done; } finally { clearTimeout(timer); }
}

async function run(args, env) {
  const child = start(args, env);
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; void stop(child); }, 10 * 60 * 1000);
  const result = await child.done;
  clearTimeout(timer);
  if (timedOut) throw new Error('Проверка превысила лимит 10 минут.');
  if (result.error) throw result.error;
  if (result.code !== 0) throw new Error(`Команда завершилась с ошибкой (${result.signal || result.code}): ${path.basename(args[0])}`);
}

async function freePort() {
  const socket = net.createServer();
  await new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.listen(0, '127.0.0.1', resolve);
  });
  const port = socket.address().port;
  await new Promise((resolve, reject) => socket.close(error => error ? reject(error) : resolve()));
  return port;
}

async function waitForServer(server, url) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (interrupted) throw new Error('Проверка прервана.');
    if (server.exitCode !== null || server.signalCode !== null) throw new Error('Тестовый сервер остановился до начала проверки.');
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      await response.arrayBuffer();
      if (response.ok) return;
    } catch { /* The server may still be starting. */ }
    await delay(200);
  }
  throw new Error('Тестовый сервер не запустился за 60 секунд.');
}

function interrupt() {
  interrupted = true;
  for (const child of children) void stop(child);
}
process.once('SIGINT', interrupt);
process.once('SIGTERM', interrupt);

let dist;
let output;
try {
  await fs.mkdir(path.join(root, 'artifacts/mobile'), { recursive: true });
  output = await fs.mkdtemp(path.join(root, 'artifacts/mobile/run-'));
  for (const browser of [chromium, webkit]) {
    try { await fs.access(browser.executablePath()); } catch {
      throw new Error('Нужны браузеры Playwright: выполните npx playwright install chromium webkit.');
    }
  }
  // Each run has its own build, so neither previews nor concurrent checks clash.
  dist = await fs.mkdtemp(path.join(root, '.next-mobile-'));
  const env = { NEXT_DIST_DIR: path.basename(dist) };
  console.log('Сборка и обязательная проверка мобильной версии…');
  await run([next, 'build'], env);
  const buildId = (await fs.readFile(path.join(dist, 'BUILD_ID'), 'utf8')).trim();
  const base = `http://127.0.0.1:${await freePort()}`;
  const server = start([next, 'start', '--hostname', '127.0.0.1', '--port', new URL(base).port], env);
  // A build-specific asset also prevents a port race from testing another app.
  await waitForServer(server, `${base}/_next/static/${encodeURIComponent(buildId)}/_buildManifest.js`);
  await run([path.join(root, 'scripts/check-mobile.mjs')], { BASE_URL: base, REVIEW_DIR: output });
  await fs.writeFile(path.join(output, 'gate.json'), JSON.stringify({ status: 'passed', completedAt: new Date().toISOString() }, null, 2));
  console.log(`Мобильная проверка пройдена. Скриншоты и отчёт: ${output}`);
} catch (error) {
  console.error(`Мобильная проверка не пройдена: ${error.message}`);
  if (output) {
    await fs.writeFile(path.join(output, 'gate.json'), JSON.stringify({ status: 'failed', error: error.message }, null, 2));
    console.error(`Отчёт: ${output}`);
  }
  process.exitCode = 1;
} finally {
  await Promise.all([...children].map(stop));
  if (dist) await fs.rm(dist, { recursive: true, force: true });
  process.removeListener('SIGINT', interrupt);
  process.removeListener('SIGTERM', interrupt);
}
