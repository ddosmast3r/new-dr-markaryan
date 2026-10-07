import HeaderClient from './HeaderClient';
import { nav } from '@/lib/nav';

// Resolve navigation on the server so full service articles and FAQs do not
// enter the client bundle just to produce a small list of menu links.
export default function Header(props) {
  return <HeaderClient {...props} nav={nav} />;
}

export { Brand } from './HeaderClient';
