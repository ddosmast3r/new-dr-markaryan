import ServicePage, { serviceMetadata } from '@/components/ServicePage';

const SLUG = 'analnaya-treshina';

export const metadata = serviceMetadata(SLUG);

export default function Page() {
  return <ServicePage slug={SLUG} />;
}
