import PageShell from '@/components/PageShell';
import Works from '@/components/Works';
import Contacts from '@/components/Contacts';
import { sectionMetadata } from '@/lib/sections';

const SLUG = 'video';

export const metadata = sectionMetadata(SLUG);

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Works />
      <Contacts intro="Посмотрели и остались вопросы? Напишите в мессенджер, отвечу сам." />
    </PageShell>
  );
}
