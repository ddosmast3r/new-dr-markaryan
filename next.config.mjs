import { sections } from './lib/sections.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Проверочный build из pre-push пишет в отдельную папку и не ломает
  // запущенный рядом `next dev`, который продолжает использовать .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  outputFileTracingRoot: import.meta.dirname,

  // Сайт был одностраничником. Старые адреса без якоря переводим на
  // соответствующие разделы; адреса с якорем (/#faq) сервер не видит —
  // их разбирает components/HashRedirect.jsx на клиенте.
  async redirects() {
    return sections
      // legacyHash === slug (раздел «Видео») дал бы редирект сам на себя
      .filter((s) => s.legacyHash && s.legacyHash !== s.slug)
      .map((s) => ({
        source: `/${s.legacyHash}`,
        destination: `/${s.slug}`,
        permanent: true,
      }));
  },
};

export default nextConfig;
