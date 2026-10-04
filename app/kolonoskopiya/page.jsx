import ColonoscopyPage from '@/components/ColonoscopyPage';
import { serviceMetadata } from '@/components/ServicePage';

const SLUG = 'kolonoskopiya';

export const metadata = serviceMetadata(SLUG);

export default function Page() {
  return <ColonoscopyPage />;
}
