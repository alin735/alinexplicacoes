'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase';
import { parseBookingMeta } from '@/lib/booking-utils';

function CanceladoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const cleanup = async () => {
      const bookingId = searchParams.get('booking_id');
      if (!bookingId) return;

      const { data: booking } = await supabase
        .from('bookings')
        .select('id, date, time_slot, observations')
        .eq('id', bookingId)
        .single();

      if (booking) {
        const bookingMeta = parseBookingMeta(booking.observations);
        const [startTime, endTime] = booking.time_slot.split('-');
        await supabase
          .from('available_slots')
          .update({ is_booked: false })
          .eq('date', booking.date)
          .eq('start_time', startTime)
          .eq('end_time', endTime);

        if (bookingMeta?.mode === 'group' && bookingMeta.groupId) {
          await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('date', booking.date)
            .eq('time_slot', booking.time_slot)
            .ilike('observations', `%group=${bookingMeta.groupId}%`);
          return;
        }

        await supabase.from('bookings').delete().eq('id', bookingId);
      }
    };
    cleanup();
  }, []);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md animate-fade-in-up">
      <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-[#000000] mb-3">Pagamento cancelado</h2>
      <p className="text-gray-500 mb-8">
        O pagamento foi cancelado. O horário foi libertado e podes tentar novamente.
      </p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => router.push('/')}
          className="px-6 py-3 bg-[#f5f5f5] text-[#111111] rounded-xl font-medium hover:bg-gray-200 transition-colors">
          Início
        </button>
        <button onClick={() => router.push('/marcar')}
          className="px-6 py-3 bg-gradient-to-r from-[#111111] to-[#2a2a2a] text-white rounded-xl font-medium hover:shadow-lg transition-all">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export default function CanceladoPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
        <Suspense fallback={
          <div className="animate-spin w-8 h-8 border-4 border-[#000000] border-t-transparent rounded-full" />
        }>
          <CanceladoContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
