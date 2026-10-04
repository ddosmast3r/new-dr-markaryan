import PageShell from '@/components/PageShell';
import Contacts from '@/components/Contacts';
import Reviews from '@/components/Reviews';
import { sectionMetadata } from '@/lib/sections';

const SLUG = 'kontakty';

export const metadata = sectionMetadata(SLUG);

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Contacts />
      <Reviews />
    </PageShell>
  );
}
