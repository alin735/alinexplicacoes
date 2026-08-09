import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';
import HomeClient from './HomeClient';

// A homepage é interativa (componente cliente), por isso os metadados vivem
// aqui, neste invólucro de servidor. É o que garante o canonical próprio.
export const metadata: Metadata = {
  alternates: {
    canonical: absoluteUrl('/'),
  },
};

export default function Page() {
  return <HomeClient />;
}
