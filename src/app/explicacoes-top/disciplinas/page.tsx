import type { Metadata } from 'next';
import DisciplinasClient from './DisciplinasClient';

export const metadata: Metadata = {
  title: 'As minhas disciplinas',
  robots: { index: false, follow: false },
};

export default function DisciplinasPage({
  searchParams,
}: {
  searchParams: { t?: string };
}) {
  return <DisciplinasClient token={searchParams.t || ''} />;
}
