import InstagramFeed from './InstagramFeed';
import { relatedPublications } from '@/lib/related-publications';

export default function RelatedPublications({ topic }) {
  const content = relatedPublications[topic];
  if (!content?.items.length) return null;
  return <InstagramFeed {...content} id={`materials-${topic}`} eyebrow="Врач объясняет" variant="context" />;
}
