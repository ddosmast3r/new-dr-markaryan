import PageShell from '@/components/PageShell';
import Diagnostics from '@/components/Diagnostics';
import Contacts from '@/components/Contacts';
import { sectionMetadata } from '@/lib/sections';

const SLUG = 'diagnostika';

export const metadata = sectionMetadata(SLUG);

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Diagnostics />
      <Contacts intro="Что именно нужно, решим на первом приёме. Напишите в мессенджер или выберите время на ПроДокторов." />
    </PageShell>
  );
}
