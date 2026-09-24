import PageShell from '@/components/PageShell';
import Steps from '@/components/Steps';
import BeforeVisit from '@/components/BeforeVisit';
import Contacts from '@/components/Contacts';
import { sectionMetadata } from '@/lib/sections';
import { faqSchema } from '@/lib/schema';
import { beforeVisit } from '@/lib/content';

const SLUG = 'kak-prohodit';

export const metadata = sectionMetadata(SLUG);

export default function Page() {
  return (
    // Вопросы блока «Перед первым приёмом» выводятся на странице целиком,
    // поэтому FAQPage-разметка соответствует видимому контенту.
    <PageShell slug={SLUG} extraSchema={[faqSchema(beforeVisit)]}>
      <Steps />
      <BeforeVisit />
      <Contacts intro="Остались вопросы про сам приём? Напишите в мессенджер, отвечу сам." />
    </PageShell>
  );
}
