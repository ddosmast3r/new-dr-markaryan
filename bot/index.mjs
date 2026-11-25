import { setTimeout as delay } from 'node:timers/promises';
import { readConfig } from './config.mjs';
import { Telegram } from './telegram.mjs';
import { VideoBot } from './controller.mjs';
import { processNext } from './media.mjs';
import { VideoStore } from '../lib/video-store.mjs';
import { QueuedTelegram, acceptUpdate, deliverNext } from './outbox.mjs';
import { SitePublisher, publishNext } from './publisher.mjs';

let stopped = false;
process.on('SIGTERM', () => { stopped = true; });
process.on('SIGINT', () => { stopped = true; });

async function main() {
  const config = readConfig();
  const store = new VideoStore(config.directory);
  // Claim the worker inside a SQLite transaction. A dead owner's PID can be
  // replaced after a crash; a second live process cannot reset active jobs.
  store.db.exec('BEGIN IMMEDIATE');
  try {
    const owner = Number(store.state('bot_pid') || 0);
    let alive = false;
    if (owner > 0) {
      try { process.kill(owner, 0); alive = true; } catch (error) { alive = error.code !== 'ESRCH'; }
    }
    if (alive) throw new Error('BOT_ALREADY_RUNNING: stop the existing worker first.');
    store.state('bot_pid', process.pid);
    store.db.exec('COMMIT');
  } catch (error) { store.db.exec('ROLLBACK'); store.close(); throw error; }
  try {
    const telegram = new Telegram(config);
    const bot = new VideoBot({ store, telegram: new QueuedTelegram(store), config });
    await telegram.call('getMe');
    await telegram.call('setMyName', { name: 'Видеоредактор Маркаряна', language_code: 'ru' });
    await telegram.call('setMyDescription', { description: 'Загрузка и публикация видео на сайте доктора Маркаряна. Отправьте видео файлом, добавьте название и описание, выберите страницы размещения и подтвердите публикацию.', language_code: 'ru' });
    await telegram.call('setMyShortDescription', { short_description: 'Управление видео на dr-markaryan.ru', language_code: 'ru' });
    await telegram.call('setMyCommands', { commands: [
      { command: 'new', description: 'Добавить видео файлом' },
      { command: 'videos', description: 'Видео команды' },
      { command: 'continue', description: 'Продолжить черновик' },
      { command: 'cancel', description: 'Отменить текущие изменения' },
      { command: 'id', description: 'Узнать свой Telegram ID' },
      { command: 'help', description: 'Как пользоваться ботом' },
    ] });
    // A killed transcode is safe to restart: unpublished files remain private.
    for (const video of store.list()) {
      if (video.status === 'processing') store.update(video.id, { status: 'queued' });
    }
    console.log('Video bot started. Access is restricted to configured IDs and redeemed invitations.');
    const worker = (async () => {
      while (!stopped) {
        try { if (!await processNext({ store, telegram, config })) await delay(1000); }
        catch { console.error('Media worker failed; retrying.'); await delay(2000); }
      }
    })();
    const sender = (async () => {
      while (!stopped) {
        try { if (!await deliverNext(store, telegram)) await delay(200); }
        catch (error) {
          console.error('Telegram delivery failed; response is queued.');
          await delay(Math.min(60, Math.max(2, error.retryAfter || 2)) * 1000);
        }
      }
    })();
    const publisher = config.remote && config.publishEnabled ? new SitePublisher(config.remote) : null;
    const publicationWorker = (async () => {
      while (!stopped && publisher) {
        try { if (!await publishNext({ store, publisher, config })) await delay(1000); }
        catch { console.error('Site publication failed; change remains queued.'); await delay(10_000); }
      }
    })();
    while (!stopped) {
      try {
        const offset = Number(store.state('telegram_offset') || 0);
        const updates = await telegram.call('getUpdates', { offset, timeout: 25, allowed_updates: ['message', 'callback_query'] });
        for (const update of updates) {
          if (stopped) break;
          await acceptUpdate(store, bot, update);
        }
      } catch (error) {
        console.error('Telegram request failed; retrying.');
        await delay(Math.min(60, Math.max(2, error.retryAfter || 2)) * 1000);
      }
    }
    await Promise.all([worker, sender, publicationWorker]);
  } finally {
    store.state('bot_pid', 0); store.close();
  }
}

main().catch((error) => {
  // Only configuration/lock errors are safe to print verbatim.
  console.error(error.message.startsWith('Set ') || error.message.startsWith('BOT_ALREADY_RUNNING') ? error.message : 'Bot could not start. Check environment and the local Bot API service.');
  process.exitCode = 1;
});
