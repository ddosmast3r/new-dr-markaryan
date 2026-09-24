'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sections } from '@/lib/sections';

// Сайт был одностраничником, и наружу могли уйти адреса вида
// dr-markaryan.ru/#faq. Якорь браузер на сервер не отправляет, поэтому
// 301 в next.config.mjs такие ссылки не ловит — перевод делаем на клиенте.
const byHash = Object.fromEntries(
  sections.filter((s) => s.legacyHash).map((s) => [s.legacyHash, `/${s.slug}`])
);

export default function HashRedirect() {
  const router = useRouter();

  useEffect(() => {
    const target = byHash[window.location.hash.slice(1)];
    if (!target) return;
    // replace, а не push: кнопка «назад» не должна возвращать на якорь,
    // с которого нас только что увело.
    router.replace(target);
  }, [router]);

  return null;
}
