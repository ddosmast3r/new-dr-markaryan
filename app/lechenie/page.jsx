import PageShell from '@/components/PageShell';
import Services from '@/components/Services';
import Contacts from '@/components/Contacts';
import { sectionMetadata } from '@/lib/sections';

const SLUG = 'lechenie';

export const metadata = sectionMetadata(SLUG);

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Services />
      <Contacts intro="Не знаете, с чем именно к врачу? Напишите в мессенджер, отвечу сам. Или выберите время на ПроДокторов." />
    </PageShell>
  );
}
