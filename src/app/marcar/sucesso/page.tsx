'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase';

function SucessoContent() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'confirmed' | 'waiting' | 'unknown'>('unknown');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const checkPayment = async () => {
      const bookingId = searchParams.get('booking_id');
      if (!bookingId) { setLoading(false); return; }

      let resolvedStatus: 'confirmed' | 'waiting' | 'unknown' = 'unknown';

      // Poll for payment confirmation (webhook may take a moment)
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase
          .from('bookings')
          .select('payment_status, status')
          .eq('id', bookingId)
          .single();

        if (data?.status === 'confirmed' || data?.status === 'completed') {
          resolvedStatus = 'confirmed';
          break;
        }

        if (data?.payment_status === 'paid' && data?.status === 'pending') {
          resolvedStatus = 'waiting';
          break;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }

      setStatus(resolvedStatus === 'unknown' ? 'confirmed' : resolvedStatus);
      setLoading(false);
    };
    checkPayment();
  }, []);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md animate-fade-in-up">
      {loading ? (
        <>
          <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="animate-spin w-10 h-10 text-[#3498db]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#0d2f4a] mb-3">A confirmar pagamento...</h2>
          <p className="text-gray-500">Aguarda um momento enquanto confirmamos o teu pagamento.</p>
        </>
      ) : (
        <>
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#0d2f4a] mb-3">
            {status === 'waiting' ? 'Pagamento registado!' : 'Pagamento confirmado!'}
          </h2>
          <p className="text-gray-500 mb-8">
            {status === 'waiting'
              ? 'O teu pagamento foi registado. A aula de grupo será confirmada quando todos os participantes pagarem.'
              : 'A tua explicação foi marcada e o pagamento foi processado com sucesso. Até breve!'}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push('/')}
              className="px-6 py-3 bg-[#f0f4f8] text-[#1a5276] rounded-xl font-medium hover:bg-gray-200 transition-colors">
              Início
            </button>
            <button onClick={() => router.push('/aulas')}
              className="px-6 py-3 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white rounded-xl font-medium hover:shadow-lg transition-all">
              Minhas aulas
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function SucessoPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4">
        <Suspense fallback={
          <div className="animate-spin w-8 h-8 border-4 border-[#3498db] border-t-transparent rounded-full" />
        }>
          <SucessoContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
