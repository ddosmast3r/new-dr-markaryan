# Размещение на Orange Pi

Хост: `root@192.168.0.50`, `orangepi3-lts`, Armbian/Debian 13, aarch64.
Бот: [@drmarkaryanbot](https://t.me/drmarkaryanbot).

- Код: `/opt/dr-markaryan-video-bot`.
- Отдельный Node.js 24: `/opt/dr-markaryan-node24/bin/node`; системный Node 20
  и окружение других приложений не меняются.
- Системный пользователь: `drmarkbot`.
- Секреты: `/etc/dr-markaryan/video-bot.env`, root, права `0600`.
- SQLite, очередь и медиа: `/var/lib/dr-markaryan/videos`.
- Служба: `dr-markaryan-video-bot.service`, автозапуск через systemd.
- Лимиты службы: одно ядро, 900 МБ памяти, пониженный приоритет CPU.

Проверка: `systemctl status dr-markaryan-video-bot` и
`journalctl -u dr-markaryan-video-bot --no-pager -n 30`.
После изменения закрытого файла окружения: `systemctl restart dr-markaryan-video-bot`.
Не выводить содержимое файла окружения в логи или переписку.

## Первоначальный режим

Пока используется облачный Telegram API: лимит скачивания 20 МБ.
`TELEGRAM_ALLOWED_USER_IDS` пуст, управление закрыто; команда `/id` позволяет
участникам узнать свой ID. После согласования добавить минимум три ID через запятую.
Публикация на сайт использует отдельный SSH-ключ в
`/var/lib/dr-markaryan/videos/site-access/`. Пользователь на сервере сайта —
`drmarkpublish`; ключ допускает только протокол передачи видео, без shell и sudo.

Сайт работает на отдельном сервере `217.149.30.67`. Приёмник:
`/opt/dr-markaryan-video-receiver/site-receiver.py`, каталог видео:
`/var/lib/dr-markaryan/videos`. На сайте используется отдельный Node.js 24
в `/opt/dr-markaryan-node24`, системный Node.js не заменяется.
Публикации, правки и снятие передаются с подтверждением версии; ссылки в
Telegram отправляются только после успешного ответа сайта.

Для крупных видео нужны локальный Telegram Bot API, собственные `api_id` и
`api_hash`, а также достаточный постоянный диск. При обнаружении корневой раздел
имел размер 3,7 ГБ; таблица разделов автоматически не менялась. Перед обработкой
крупных исходников выделить место под оригиналы, MP4 и кеш Telegram Bot API.

Резервные копии: каталог данных и закрытый файл окружения. Копии с токеном хранить
вне Git. Инструкции по согласованному копированию SQLite — в README бота.
