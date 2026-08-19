import SectionView from '../_sections/SectionView';
import { PORTAL_SECTIONS } from '@/lib/portal';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <SectionView section={PORTAL_SECTIONS.fichas} />;
}
