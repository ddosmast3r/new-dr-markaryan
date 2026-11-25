#!/usr/bin/env python3
"""Forced SSH command. No shell, forwarding, arbitrary paths or commands."""
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shlex
import sqlite3
import sys
import tempfile
from datetime import datetime

ROOT = Path(os.environ.get('VIDEO_DATA_DIR', '/var/lib/dr-markaryan/videos'))
PAGES = Path(os.environ.get('VIDEO_PAGES_FILE', '/opt/dr-markaryan-video-receiver/pages.json'))
ASSETS = {'video.mp4': 2_000_000_000, 'poster.webp': 10_000_000, 'poster-blurred.webp': 10_000_000}

def require(condition, message='INVALID_REQUEST'):
    if not condition:
        raise ValueError(message)

def connect():
    ROOT.mkdir(mode=0o750, parents=True, exist_ok=True)
    db = sqlite3.connect(ROOT / 'catalog.sqlite', timeout=10)
    db.execute('PRAGMA journal_mode=WAL')
    db.execute('CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY, data TEXT NOT NULL, version INTEGER NOT NULL)')
    db.execute('CREATE TABLE IF NOT EXISTS assets (id TEXT, name TEXT, sha TEXT, size INTEGER, PRIMARY KEY(id,name))')
    return db

def validate_id(value):
    require(re.fullmatch(r'[a-f0-9]{16}', value) is not None)

def main():
    args = shlex.split(os.environ.get('SSH_ORIGINAL_COMMAND', ''))
    require(len(args) >= 2 and args[0] == 'edjo-video')
    operation = args[1]
    if operation == 'health' and len(args) == 2:
        with connect() as db:
            db.execute('SELECT 1')
        return {'ok': True, 'protocol': 1, 'pages': json.loads(PAGES.read_text())}
    require(operation in ('inspect', 'put', 'apply'))
    if operation in ('inspect', 'put'):
        require(len(args) >= 3)
        video_id = args[2]
        validate_id(video_id)
    if operation == 'inspect':
        require(len(args) == 3)
        with connect() as db:
            row = db.execute('SELECT data FROM videos WHERE id=?', (video_id,)).fetchone()
            assets = {name: {'sha': sha, 'size': size} for name, sha, size in db.execute('SELECT name,sha,size FROM assets WHERE id=?', (video_id,))
                      if (ROOT / video_id / name).is_file()}
        return {'ok': True, 'assets': assets, 'revision': json.loads(row[0]).get('editVersion', 0) if row else 0}
    if operation == 'put':
        require(len(args) == 6)
        asset, size_string, sha = args[3:]
        require(asset in ASSETS and size_string.isdecimal())
        size = int(size_string)
        require(0 < size <= ASSETS[asset] and re.fullmatch(r'[a-f0-9]{64}', sha) is not None)
        folder = ROOT / video_id
        folder.mkdir(mode=0o750, parents=True, exist_ok=True)
        disk = os.statvfs(folder)
        require(disk.f_bavail * disk.f_frsize > size + 128_000_000, 'DISK_LOW')
        fd, temporary = tempfile.mkstemp(prefix='.upload-', dir=folder)
        try:
            digest = hashlib.sha256()
            remaining = size
            with os.fdopen(fd, 'wb') as target:
                while remaining:
                    chunk = sys.stdin.buffer.read(min(1024 * 1024, remaining))
                    require(bool(chunk), 'INCOMPLETE_UPLOAD')
                    remaining -= len(chunk)
                    digest.update(chunk)
                    target.write(chunk)
                require(not sys.stdin.buffer.read(1), 'EXCESS_UPLOAD')
                target.flush()
                os.fsync(target.fileno())
                os.fchmod(target.fileno(), 0o640)
            require(digest.hexdigest() == sha, 'CHECKSUM_MISMATCH')
            os.replace(temporary, folder / asset)
            with connect() as db:
                db.execute('INSERT OR REPLACE INTO assets VALUES (?,?,?,?)', (video_id, asset, sha, size))
        finally:
            Path(temporary).unlink(missing_ok=True)
        return {'ok': True, 'sha': sha}
    require(len(args) == 2)
    body = sys.stdin.buffer.read(65537)
    require(len(body) <= 65536)
    payload = json.loads(body)
    video_id = payload.get('id', '')
    validate_id(video_id)
    require(payload.get('status') in ('published', 'unpublished'))
    require(isinstance(payload.get('title'), str) and 0 < len(payload['title']) <= 150)
    require(isinstance(payload.get('summary'), str) and len(payload['summary']) <= 1500)
    require(type(payload.get('sensitive')) is bool)
    require(type(payload.get('editVersion')) is int and 0 < payload['editVersion'] < 1_000_000_000)
    allowed = set(json.loads(PAGES.read_text()))
    require(isinstance(payload.get('pages'), list) and len(payload['pages']) <= len(allowed))
    require(all(isinstance(page, str) and page in allowed for page in payload['pages']))
    for name in ('width', 'height'):
        require(type(payload.get(name)) is int and 0 < payload[name] <= 8192)
    require(type(payload.get('duration')) in (float, int) and math.isfinite(payload['duration']) and 0 < payload['duration'] <= 7201)
    for name in ('createdBy', 'updatedBy'):
        require(isinstance(payload.get(name), str) and payload[name].isdecimal() and len(payload[name]) <= 20)
    for name in ('createdAt', 'updatedAt', 'publishedAt'):
        require(isinstance(payload.get(name), str) and len(payload[name]) < 40)
        require(datetime.fromisoformat(payload[name].replace('Z', '+00:00')).tzinfo is not None)
    names = ('id', 'status', 'title', 'summary', 'pages', 'sensitive', 'editVersion', 'width', 'height', 'duration', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt', 'publishedAt')
    clean = {name: payload[name] for name in names}
    with connect() as db:
        db.execute('BEGIN IMMEDIATE')
        row = db.execute('SELECT data,version FROM videos WHERE id=?', (video_id,)).fetchone()
        revision = json.loads(row[0]).get('editVersion', 0) if row else 0
        if revision < clean['editVersion']:
            if clean['status'] == 'published':
                for asset in ASSETS:
                    require((ROOT / video_id / asset).is_file(), 'MEDIA_MISSING')
                    require(db.execute('SELECT 1 FROM assets WHERE id=? AND name=?', (video_id, asset)).fetchone(), 'MEDIA_MISSING')
            db.execute('INSERT OR REPLACE INTO videos VALUES (?,?,?)', (video_id, json.dumps(clean), (row[1] if row else 0) + 1))
            revision = clean['editVersion']
    return {'ok': True, 'id': video_id, 'revision': revision}

if __name__ == '__main__':
    os.umask(0o027)
    try:
        print(json.dumps(main()))
    except Exception:
        print(json.dumps({'ok': False, 'error': 'RECEIVER_REJECTED'}))
        sys.exit(1)
