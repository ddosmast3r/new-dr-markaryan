import { connection } from 'next/server';
import { VideoStore, publicVideo } from './video-store.mjs';

export async function publishedVideos(slug) {
  // Files and SQLite are read at request time, never baked into the build.
  await connection();
  const store = new VideoStore(undefined, { readonly: true });
  try { return store.published(slug).map(publicVideo); }
  finally { store.close(); }
}
