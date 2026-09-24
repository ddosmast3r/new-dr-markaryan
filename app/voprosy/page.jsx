import PageShell from '@/components/PageShell';
import Faq from '@/components/Faq';
import Contacts from '@/components/Contacts';
import { sectionMetadata } from '@/lib/sections';
import { faqSchema } from '@/lib/schema';
import { faq } from '@/lib/content';

const SLUG = 'voprosy';

export const metadata = sectionMetadata(SLUG);

export default function Page() {
  return (
    // Вопросы и ответы выводятся на странице целиком (внутри <details>),
    // поэтому FAQPage-разметка соответствует видимому контенту.
    <PageShell slug={SLUG} extraSchema={[faqSchema(faq)]}>
      <Faq />
      <Contacts intro="Не нашли свой вопрос? Напишите в мессенджер, отвечу сам." />
    </PageShell>
  );
}
