// Import only the reviewed files that still exist in ref. No network requests.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'ref/instagram/dr.markaryan_ed');
const manifest = JSON.parse(await fs.readFile(path.join(source, 'manifest.json'), 'utf8'));
const titles = {
  DfxSQCcI2G1: ['Больно ли на осмотре?', 'Отвечаю на частый вопрос перед первым визитом.'],
  Dfpb1RACLEM: ['Как подготовиться к приёму', 'Восемь карточек: что взять с собой и о чём рассказать врачу.'],
  Dfe1hHdIKny: ['Пять советов из интернета', 'Разбираю популярные советы о лечении геморроя.'],
  DfckO2QIyNl: ['Давайте познакомимся', 'О моей работе, подходе к лечению и приёме пациентов.'],
};
const posts = [];
for (const post of manifest.posts) {
  try { await fs.access(path.join(source, post.folder)); } catch { continue; }
  const media = [];
  for (const item of post.media) {
    const file = path.join(source, item.file);
    try { await fs.access(file); } catch { continue; }
    const target = path.join(root, 'public/instagram', post.id);
    await fs.mkdir(target, { recursive: true });
    await fs.copyFile(file, path.join(target, path.basename(file)));
    const poster = item.type === 'video' ? file.replace(/\.mp4$/, '.jpg') : file;
    await fs.access(poster);
    if (item.type === 'video') await fs.copyFile(poster, path.join(target, path.basename(poster)));
    media.push({ type: item.type, src: `/instagram/${post.id}/${path.basename(file)}`, poster: `/instagram/${post.id}/${path.basename(poster)}` });
  }
  if (!media.length) continue;
  const [title, summary] = titles[post.id] || [post.caption.split('\n')[0], 'Новая публикация врача.'];
  const date = `${post.date.slice(0, 4)}-${post.date.slice(4, 6)}-${post.date.slice(6, 8)}`;
  posts.push({ id: post.id, date, title, summary, caption: post.caption, url: post.url, media });
}
posts.sort((a, b) => b.date.localeCompare(a.date));
await fs.writeFile(path.join(root, 'lib/instagram-feed.json'), JSON.stringify(posts, null, 2) + '\n');
console.log(`Импортировано публикаций: ${posts.length}. Удалённые из ref публикации пропущены.`);
