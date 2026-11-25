import { VideoStore } from '../lib/video-store.mjs';
import { mintInvite } from './access.mjs';

const uses = process.argv[2] ? Number(process.argv[2]) : 3;
const days = process.argv[3] ? Number(process.argv[3]) : 7;
const store = new VideoStore();
try {
  const token = mintInvite(store, { uses, days });
  console.log(`https://t.me/drmarkaryanbot?start=join_${token}`);
} finally { store.close(); }
