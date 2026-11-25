import Procedures from './Procedures';
import Reveal from './Reveal';
import { publishedVideos } from '@/lib/video-library.mjs';

export default async function UploadedVideos({ slug }) {
  const items = await publishedVideos(slug);
  if (!items.length) return null;
  return (
    <section className="section section-tint" id="uploaded-videos">
      <div className="container">
        <Reveal className="section-head"><h2>Видео врача</h2></Reveal>
        <Procedures items={items} />
      </div>
    </section>
  );
}
