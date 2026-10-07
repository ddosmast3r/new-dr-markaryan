import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';
import { sections } from './lib/sections.js';
import { SITE } from './lib/content.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: import.meta.dirname,

  async headers() {
    return [{
      // Filenames include content hashes; updated fonts get a new filename.
      source: '/fonts/:file(.*\\.woff2)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    }];
  },

  // Сайт был одностраничником. Старые адреса без якоря переводим на
  // соответствующие разделы; адреса с якорем (/#faq) сервер не видит —
  // их разбирает components/HashRedirect.jsx на клиенте.
  async redirects() {
    const legacyRedirects = sections
      // legacyHash === slug (раздел «Видео») дал бы редирект сам на себя
      .filter((s) => s.legacyHash && s.legacyHash !== s.slug)
      .map((s) => ({
        source: `/${s.legacyHash}`,
        destination: `/${s.slug}`,
        permanent: true,
      }));

    return [
      // Preserve paths and query parameters while consolidating the www mirror.
      // Host matching leaves local previews and the canonical domain untouched.
      ...legacyRedirects.map((redirect) => ({
        ...redirect,
        has: [{ type: 'host', value: 'www\\.dr-markaryan\\.ru' }],
        destination: `${SITE}${redirect.destination}`,
      })),
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www\\.dr-markaryan\\.ru' }],
        destination: `${SITE}/:path*`,
        permanent: true,
      },
      ...legacyRedirects,
    ];
  },
};

const configureNext = (phase) => ({
  ...nextConfig,
  // Dev и production не перезаписывают сборки друг друга.
  // Проверки могут задать собственный каталог через NEXT_DIST_DIR.
  distDir: process.env.NEXT_DIST_DIR
    || (phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next'),
});

export default configureNext;
