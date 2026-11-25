import { readFile } from 'node:fs/promises';

export class Telegram {
  constructor(config, fetcher = fetch) { this.config = config; this.fetcher = fetcher; }
  async call(method, payload = {}, { timeout = 60_000 } = {}) {
    let response;
    try {
      response = await this.fetcher(`${this.config.apiUrl}/bot${this.config.token}/${method}`, {
        method: 'POST', body: payload instanceof FormData ? payload : JSON.stringify(payload),
        headers: payload instanceof FormData ? {} : { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(timeout),
      });
    } catch {
      // Fetch exceptions may include the URL and therefore the bot token.
      throw new Error('TELEGRAM_UNAVAILABLE');
    }
    let result;
    try { result = await response.json(); } catch { throw new Error('TELEGRAM_INVALID_RESPONSE'); }
    if (!result.ok) {
      const error = new Error(`TELEGRAM_${result.error_code || response.status}`);
      error.retryAfter = result.parameters?.retry_after;
      throw error;
    }
    return result.result;
  }
  send(chatId, text, keyboard) {
    return this.call('sendMessage', { chat_id: chatId, text, reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined });
  }
  async photo(chatId, filename) {
    const jpeg = await readFile(filename);
    const form = new FormData();
    form.append('chat_id', String(chatId));
    form.append('photo', new Blob([jpeg], { type: 'image/jpeg' }), 'preview.jpg');
    return this.call('sendPhoto', form);
  }
}
