import PageShell from '@/components/PageShell';
import About from '@/components/About';
import RelatedPublications from '@/components/RelatedPublications';
import Research from '@/components/Research';
import Contacts from '@/components/Contacts';
import { sectionMetadata } from '@/lib/sections';

const SLUG = 'o-vrache';

export const metadata = sectionMetadata(SLUG);

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <About />
      <RelatedPublications topic="doctor" />
      <Research />
      <Contacts intro="Если остались вопросы, напишите в мессенджер, отвечу сам. Или выберите время на ПроДокторов." />
    </PageShell>
  );
}
