import { createHash } from 'node:crypto';

// Conversation changes and outbound responses commit together. A Telegram
// outage retries delivery, never feeds the same title into the next wizard step.
export class QueuedTelegram {
  constructor(store) { this.store = store; }
  async call(method, payload = {}) { this.store.enqueue(method, payload); }
  send(chatId, text, keyboard) {
    return this.call('sendMessage', { chat_id: chatId, text, reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined });
  }
  photo(chatId, filename) { return this.call('_photo', { chatId, filename }); }
}

export async function acceptUpdate(store, bot, update) {
  if (update.update_id < Number(store.state('telegram_offset') || 0)) return;
  store.db.exec('BEGIN IMMEDIATE');
  try {
    const message = update.message;
    const identity = update.callback_query ? `callback:${update.callback_query.id}`
      : message ? `message:${message.chat.id}:${message.message_id}` : `update:${update.update_id}`;
    const seenKey = `handled:${createHash('sha256').update(identity).digest('hex')}`;
    // Message identity survives moving from cloud to a local Bot API even if
    // that server starts its update queue with different numeric update IDs.
    if (!store.state(seenKey)) {
      await bot.handle(update);
      store.state(seenKey, '1');
    }
    store.state('telegram_offset', update.update_id + 1);
    store.db.exec('COMMIT');
  } catch (error) { store.db.exec('ROLLBACK'); throw error; }
}

export async function deliverNext(store, telegram) {
  const message = store.nextMessage();
  if (!message) return false;
  try {
    if (message.method === '_photo') await telegram.photo(message.data.chatId, message.data.filename);
    else await telegram.call(message.method, message.data);
  } catch (error) {
    // Expired callback answers, "message not modified", blocked users and
    // unreadable covers cannot permanently block everybody's response queue.
    if (!['TELEGRAM_400', 'TELEGRAM_403', 'ENOENT'].includes(error.message) && error.code !== 'ENOENT') throw error;
  }
  store.acknowledgeMessage(message.id);
  return true;
}
