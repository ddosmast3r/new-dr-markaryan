import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { videoPages, validVideoPages } from '../lib/video-pages.js';
import { videoIdIsValid } from '../lib/video-store.mjs';

const fields = (video) => ({ title: video.title, summary: video.summary, pages: [...video.pages], sensitive: video.sensitive });
const button = (text, callback_data) => ({ text, callback_data });
const statusLabels = { queued: 'В очереди', processing: 'Обрабатывается', ready: 'Готов к публикации', failed: 'Ошибка обработки', published: 'Опубликован', unpublished: 'Снят с публикации' };
const documentHint = 'Отправьте видео документом: скрепка → Файл. Так Telegram передаст исходный файл без сжатия.';

export class VideoBot {
  constructor({ store, telegram, config }) { Object.assign(this, { store, telegram, config }); }
  send(chatId, text, keyboard) { return this.telegram.send(chatId, text, keyboard); }
  persist(userId, session) {
    const video = this.store.get(session.videoId);
    // Draft metadata survives navigating away or a restart. Published edits
    // stay in the participant's private session until Save is pressed.
    if (video && !['published', 'unpublished'].includes(video.status)
      && (video.editVersion || 0) === session.editVersion
      && JSON.stringify(fields(video)) !== JSON.stringify(session.fields)) {
      const updated = this.store.update(video.id, { ...session.fields, editVersion: session.editVersion + 1 });
      session.editVersion = updated.editVersion;
    }
    this.store.session(userId, session); return session;
  }
  async handle(update) {
    const callback = update.callback_query;
    const message = callback?.message || update.message;
    const user = callback?.from || message?.from;
    if (!message || !user || user.is_bot || message.chat.type !== 'private') return;
    const chatId = message.chat.id;
    const userId = String(user.id);
    if (message.text === '/id' && !callback) return this.send(chatId, `Ваш Telegram ID: ${userId}`);
    if (!this.config.allowedUsers.has(userId)) {
      if (callback) await this.telegram.call('answerCallbackQuery', { callback_query_id: callback.id, text: 'Доступ закрыт' });
      else await this.send(chatId, 'Доступ к управлению видео закрыт. Попросите владельца добавить ваш Telegram ID. Узнать его: /id');
      return;
    }
    if (callback) {
      await this.telegram.call('answerCallbackQuery', { callback_query_id: callback.id });
      return this.callback(userId, chatId, callback);
    }
    const text = message.text?.trim();
    const command = text?.split(/\s/)[0].split('@')[0];
    if (command === '/start' || command === '/help') return this.send(chatId,
      `Видеоредактор Маркаряна\n\n${documentHint}\n\nКаждый ролик попадёт в «Видео». Дополнительно можно выбрать несколько страниц сайта.\n\n/new — новое видео\n/videos — все видео команды\n/continue — продолжить черновик\n/cancel — отменить текущие изменения\n/id — ваш Telegram ID`);
    if (command === '/cancel') {
      this.store.session(userId, null);
      return this.send(chatId, 'Текущие изменения отменены. Опубликованные видео остаются на сайте. /new — добавить видео, /videos — открыть список.');
    }
    if (command === '/videos') return this.list(chatId, 0);
    if (command === '/new') {
      if (this.store.session(userId)) return this.send(chatId, 'Сначала завершите текущий черновик через /continue или отмените изменения: /cancel.');
      return this.send(chatId, documentHint);
    }
    if (command === '/continue') return this.resume(userId, chatId);
    if (message.video || message.animation || message.video_note) return this.send(chatId, documentHint);
    if (message.document) return this.document(userId, chatId, message);
    const session = this.store.session(userId);
    if (!session) return this.send(chatId, documentHint);
    if (session.step === 'title') {
      if (!text || text.startsWith('/') || text.length > 150) return this.send(chatId, 'Введите название от 1 до 150 символов.');
      session.fields.title = text;
      session.step = session.returnTo || 'summary';
      delete session.returnTo;
    } else if (session.step === 'summary') {
      if (!text || (text.startsWith('/') && text !== '/skip') || text.length > 1500) return this.send(chatId, 'Введите описание до 1500 символов или /skip, чтобы оставить его пустым.');
      session.fields.summary = text === '/skip' ? '' : text;
      session.step = session.returnTo || 'pages';
      delete session.returnTo;
    } else return this.resume(userId, chatId);
    this.persist(userId, session);
    return this.resume(userId, chatId);
  }
  async document(userId, chatId, message) {
    const document = message.document;
    if (!/\.(mp4|mov|m4v|mkv|webm|avi)$/i.test(document.file_name || '')) return this.send(chatId, 'Нужен видеофайл MP4, MOV, M4V, MKV, WebM или AVI, отправленный документом.');
    if (!Number.isSafeInteger(document.file_size) || document.file_size < 1 || document.file_size > this.config.maxBytes) {
      return this.send(chatId, `Файл слишком большой или размер не указан. Лимит: ${Math.floor(this.config.maxBytes / 1_000_000)} МБ.`);
    }
    const sourceKey = `${chatId}:${message.message_id}`;
    const existing = this.store.list().find((video) => video.sourceKey === sourceKey);
    if (existing) return; // Redelivered update, already accepted.
    if (this.store.session(userId)) return this.send(chatId, 'У вас уже есть текущий черновик. /continue — продолжить, /cancel — отменить изменения перед новым файлом.');
    const video = this.store.create({ actor: userId, fileId: document.file_id, fileSize: document.file_size,
      filename: document.file_name, sourceKey, chatId });
    this.open(userId, video, 'title');
    return this.send(chatId, 'Файл принят в обработку. Как назвать видео? Введите название до 150 символов.');
  }
  open(userId, video, step = 'preview') {
    return this.persist(userId, { videoId: video.id, nonce: randomBytes(5).toString('hex'), step,
      editVersion: video.editVersion || 0, fields: fields(video) });
  }
  async list(chatId, page) {
    const videos = this.store.list().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    page = Math.min(Math.max(0, page), Math.max(0, Math.ceil(videos.length / 8) - 1));
    if (!videos.length) return this.send(chatId, `Видео пока нет.\n\n${documentHint}`);
    const keyboard = videos.slice(page * 8, page * 8 + 8).map((video) => [button(
      `${statusLabels[video.status]}: ${(video.title || video.filename).slice(0, 45)}`, `open:${video.id}`)]);
    const navigation = [];
    if (page > 0) navigation.push(button('Назад', `list:${page - 1}`));
    if ((page + 1) * 8 < videos.length) navigation.push(button('Далее', `list:${page + 1}`));
    if (navigation.length) keyboard.push(navigation);
    return this.send(chatId, `Видео команды · страница ${page + 1}\nВыберите ролик для просмотра и редактирования.`, keyboard);
  }
  async resume(userId, chatId) {
    const session = this.store.session(userId);
    if (!session) return this.send(chatId, `Текущего черновика нет. /videos — открыть видео.\n\n${documentHint}`);
    if (session.step === 'title') return this.send(chatId, 'Введите название видео до 150 символов.');
    if (session.step === 'summary') return this.send(chatId, 'Введите описание до 1500 символов или /skip.');
    if (session.step === 'pages') return this.pages(chatId, session);
    if (session.step === 'sensitive') return this.send(chatId, 'Есть ли в ролике кадры операции? При ответе «Да» сайт скроет обложку и покажет предупреждение перед просмотром.', [
      [button('Да, нужно предупреждение', `s:${session.nonce}:yes`)], [button('Нет', `s:${session.nonce}:no`)],
    ]);
    return this.preview(chatId, session);
  }
  pageKeyboard(session) {
    return [...videoPages.map(({ slug, label }) => [button(`${session.fields.pages.includes(slug) ? '☑' : '☐'} ${label}`, `s:${session.nonce}:page:${slug}`)]),
      [button('Готово', `s:${session.nonce}:done`)]];
  }
  pages(chatId, session) {
    return this.send(chatId, '«Видео» включено всегда. Отметьте дополнительные страницы или сразу нажмите «Готово».', this.pageKeyboard(session));
  }
  async preview(chatId, session) {
    const video = this.store.get(session.videoId);
    if (!video) return this.send(chatId, 'Видео не найдено. /cancel — начать заново.');
    const labels = videoPages.filter(({ slug }) => session.fields.pages.includes(slug)).map(({ label }) => label);
    const ready = ['ready', 'published', 'unpublished'].includes(video.status);
    const keyboard = [];
    if (ready && session.fields.title) keyboard.push([button(video.status === 'published' ? 'Сохранить изменения' : 'Опубликовать', `s:${session.nonce}:publish`)]);
    keyboard.push([button('Название', `s:${session.nonce}:title`), button('Описание', `s:${session.nonce}:summary`)]);
    keyboard.push([button('Страницы', `s:${session.nonce}:pages`), button('Предупреждение', `s:${session.nonce}:sensitive`)]);
    if (video.status === 'published') keyboard.push([button('Снять с публикации', `s:${session.nonce}:unpublish`)]);
    if (video.status === 'failed') keyboard.push([button('Повторить обработку', `s:${session.nonce}:retry`)]);
    if (!ready && video.status !== 'failed') keyboard.push([button('Проверить готовность', `s:${session.nonce}:refresh`)]);
    const text = `${video.syncPending ? 'Изменения передаются на сайт' : statusLabels[video.status]}\n\n${session.fields.title || 'Без названия'}\n${session.fields.summary || 'Без описания'}\n\nСтраницы: Видео${labels.length ? `, ${labels.join(', ')}` : ''}\nПредупреждение: ${session.fields.sensitive ? 'да' : 'нет'}\n\nЗагрузил: ${video.createdBy}${video.updatedBy ? ` · Последнее изменение: ${video.updatedBy}` : ''}`;
    if (ready) {
      try {
        await this.telegram.photo(chatId, path.join(this.config.directory, video.id, 'preview.jpg'));
      } catch { /* Text preview remains usable if sending the cover fails. */ }
    }
    return this.send(chatId, text, keyboard);
  }
  async callback(userId, chatId, callback) {
    const data = callback.data || '';
    if (/^list:\d{1,6}$/.test(data)) return this.list(chatId, Number(data.split(':')[1]));
    if (data.startsWith('open:')) {
      const id = data.slice(5);
      const video = videoIdIsValid(id) && this.store.get(id);
      if (!video) return this.send(chatId, 'Видео не найдено.');
      const current = this.store.session(userId);
      if (current?.videoId === id && current.editVersion === (video.editVersion || 0)) return this.resume(userId, chatId);
      const session = this.open(userId, video, video.title ? 'preview' : 'title');
      return this.resume(userId, chatId, session);
    }
    const [, nonce, action, slug] = data.split(':');
    const session = this.store.session(userId);
    if (!data.startsWith('s:') || !session || nonce !== session.nonce) return this.send(chatId, 'Эта карточка устарела. /continue — открыть текущую, /videos — выбрать видео.');
    if (action === 'page' && session.step === 'pages') {
      session.fields.pages = validVideoPages(session.fields.pages.includes(slug)
        ? session.fields.pages.filter((page) => page !== slug) : [...session.fields.pages, slug]);
      this.persist(userId, session);
      try {
        return await this.telegram.call('editMessageReplyMarkup', { chat_id: chatId, message_id: callback.message.message_id,
          reply_markup: { inline_keyboard: this.pageKeyboard(session) } });
      } catch { return this.pages(chatId, session); }
    }
    if (action === 'done' && session.step === 'pages') {
      session.step = session.returnTo || 'sensitive'; delete session.returnTo;
    } else if (['yes', 'no'].includes(action) && session.step === 'sensitive') {
      session.fields.sensitive = action === 'yes'; session.step = 'preview'; delete session.returnTo;
    } else if (['title', 'summary', 'pages', 'sensitive'].includes(action) && session.step === 'preview') {
      session.step = action; session.returnTo = 'preview';
    } else if (action === 'refresh' && session.step === 'preview') {
      // Re-read processing status without changing the draft.
    } else if (action === 'publish' && session.step === 'preview') return this.publish(userId, chatId, session);
    else if (action === 'unpublish' && session.step === 'preview') {
      session.step = 'confirmHide'; this.persist(userId, session);
      return this.send(chatId, 'Снять видео со всех страниц сайта?', [[button('Да, снять', `s:${nonce}:hide`), button('Оставить', `s:${nonce}:keep`)]]);
    } else if (action === 'keep' && session.step === 'confirmHide') session.step = 'preview';
    else if (action === 'hide' && session.step === 'confirmHide') {
      const video = this.store.get(session.videoId);
      if ((video.editVersion || 0) !== session.editVersion) return this.conflict(chatId);
      const updated = this.store.update(video.id, { status: 'unpublished', updatedBy: userId, updatedAt: new Date().toISOString(), editVersion: session.editVersion + 1,
        ...(this.config.remote ? { syncPending: true, syncChatId: chatId } : {}) }, video.version);
      this.open(userId, updated);
      return this.send(chatId, this.config.remote ? 'Передаю снятие публикации на сайт. Сообщу, когда он подтвердит изменение.' : 'Видео снято со всех страниц сайта. Вернуть его можно через /videos.');
    } else if (action === 'retry' && session.step === 'preview') {
      const video = this.store.get(session.videoId);
      if (video.status === 'failed') this.store.update(video.id, { status: 'queued' }, video.version);
    } else return this.send(chatId, 'Откройте текущий шаг через /continue.');
    this.persist(userId, session);
    return this.resume(userId, chatId);
  }
  conflict(chatId) { return this.send(chatId, 'Другой участник уже изменил этот ролик. Откройте актуальную версию через /videos перед сохранением.'); }
  async publish(userId, chatId, session) {
    if (this.config.publishEnabled === false) return this.send(chatId, 'Публикация пока не подключена к серверу сайта. Черновик сохранён.');
    const video = this.store.get(session.videoId);
    if ((video.editVersion || 0) !== session.editVersion) return this.conflict(chatId);
    if (!['ready', 'published', 'unpublished'].includes(video.status)) return this.send(chatId, 'Сначала дождитесь завершения обработки. /continue — проверить готовность.');
    if (!session.fields.title.trim()) return this.send(chatId, 'Сначала укажите название.');
    const pages = validVideoPages(session.fields.pages);
    this.store.update(video.id, { ...session.fields, pages, status: 'published', updatedBy: userId,
      updatedAt: new Date().toISOString(), publishedAt: video.publishedAt || new Date().toISOString(), editVersion: session.editVersion + 1,
      ...(this.config.remote ? { syncPending: true, syncChatId: chatId } : {}) }, video.version);
    this.store.session(userId, null);
    if (this.config.remote) return this.send(chatId, 'Передаю видео и изменения на сайт. Пришлю ссылки после подтверждения публикации.');
    const links = [`${this.config.siteUrl}/video#video-${video.id}`,
      ...videoPages.filter(({ slug }) => pages.includes(slug)).map(({ href }) => `${this.config.siteUrl}${href}#video-${video.id}`)];
    return this.send(chatId, `Готово! Видео опубликовано.\n\n${links.join('\n')}\n\n/videos — управление видео`);
  }
}
