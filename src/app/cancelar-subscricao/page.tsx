import type { Metadata } from 'next';
import UnsubscribeClient from './UnsubscribeClient';

export const metadata: Metadata = {
  title: 'Cancelar subscrição',
  robots: { index: false, follow: false },
};

export default function CancelarSubscricaoPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return <UnsubscribeClient token={searchParams.token || ''} />;
}
