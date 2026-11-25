#!/usr/bin/env python3
"""Run as root on Orange Pi after installing the local API and its credentials."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
import urllib.request

BOT_ENV = Path('/etc/dr-markaryan/video-bot.env')
API_ENV = Path('/etc/dr-markaryan/telegram-api.env')
PHASE = Path('/etc/dr-markaryan/local-api-migration.json')
LOCAL = 'http://127.0.0.1:8081'

def environment(filename):
    return dict(line.split('=', 1) for line in filename.read_text().splitlines() if '=' in line and not line.startswith('#'))

def run(*arguments):
    subprocess.run(arguments, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def private_write(filename, text):
    fd, temporary = tempfile.mkstemp(prefix='.migration-', dir=filename.parent)
    try:
        with os.fdopen(fd, 'w') as stream:
            os.fchmod(stream.fileno(), 0o600)
            stream.write(text)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, filename)
    finally:
        Path(temporary).unlink(missing_ok=True)

def main():
    assert os.geteuid() == 0
    credentials = environment(API_ENV)
    assert re.fullmatch(r'[1-9]\d*', credentials.get('TELEGRAM_API_ID', ''))
    assert re.fullmatch(r'[a-fA-F0-9]{32}', credentials.get('TELEGRAM_API_HASH', ''))
    assert Path('/opt/telegram-bot-api/bin/telegram-bot-api').is_file()
    current = environment(BOT_ENV)
    token = current['TELEGRAM_BOT_TOKEN']

    def call(base, method):
        request = urllib.request.Request(base + '/bot' + token + '/' + method, data=b'{}', headers={'Content-Type': 'application/json'})
        try:
            result = json.loads(urllib.request.urlopen(request, timeout=120).read())
        except Exception:
            raise RuntimeError('Telegram API request failed; credentials were not printed.') from None
        if not result.get('ok'):
            raise RuntimeError('Telegram API request rejected; credentials were not printed.')
        return result['result']

    run('systemctl', 'enable', '--now', 'telegram-bot-api.service')
    time.sleep(2)
    backup = BOT_ENV.with_name('video-bot.before-local-api.env')
    if not backup.exists():
        private_write(backup, BOT_ENV.read_text())
    run('systemctl', 'stop', 'dr-markaryan-video-bot.service')
    if current.get('TELEGRAM_API_URL') != LOCAL and not PHASE.exists():
        try:
            call('https://api.telegram.org', 'logOut')
        except Exception:
            run('systemctl', 'start', 'dr-markaryan-video-bot.service')
            raise
        private_write(PHASE, json.dumps({'phase': 'cloud_logged_out', 'time': time.time()}))
    # If initialization was interrupted, rerunning resumes here without trying
    # to log back into the cloud during Telegram's ten-minute logout cooldown.
    connected = False
    for _ in range(5):
        try:
            call(LOCAL, 'getMe')
            connected = True
            break
        except RuntimeError:
            time.sleep(3)
    if not connected:
        raise RuntimeError('Local API is not ready. Check its private service log, then rerun this migration; the bot remains stopped to avoid two sessions.')
    current.update(TELEGRAM_API_URL=LOCAL, TELEGRAM_API_FILES_DIR='/var/lib/telegram-bot-api', VIDEO_MAX_BYTES='2000000000')
    private_write(BOT_ENV, '\n'.join(key + '=' + value for key, value in current.items()) + '\n')
    run('runuser', '-u', 'drmarkbot', '--', '/usr/bin/python3', '-c',
        "import sqlite3,sys; db=sqlite3.connect(sys.argv[1]); db.execute(\"INSERT OR REPLACE INTO state (key,value) VALUES (?,?)\", ('telegram_offset','0')); db.commit(); db.close()",
        str(Path(current['VIDEO_DATA_DIR']) / 'catalog.sqlite'))
    dropin = Path('/etc/systemd/system/dr-markaryan-video-bot.service.d')
    dropin.mkdir(parents=True, exist_ok=True)
    (dropin / 'local-api.conf').write_text('[Unit]\nAfter=telegram-bot-api.service\nWants=telegram-bot-api.service\n')
    run('systemctl', 'daemon-reload')
    run('systemctl', 'start', 'dr-markaryan-video-bot.service')
    PHASE.unlink(missing_ok=True)
    print('Local Telegram Bot API connected. Video limit: 2,000 MB. Authorized users and site publisher settings preserved.')

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error) if isinstance(error, RuntimeError) else 'Migration prerequisites are incomplete. Check the private environment files and installed binary.')
        sys.exit(1)
