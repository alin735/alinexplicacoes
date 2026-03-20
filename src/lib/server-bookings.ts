import { createClient } from '@supabase/supabase-js';
import { parseBookingMeta } from '@/lib/booking-utils';

type BookingRow = {
  id: string;
  student_id: string;
  subject: string;
  date: string;
  time_slot: string;
  observations: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'pending_payment' | 'paid';
};

export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Configuração Supabase incompleta no servidor.');
  }

  return createClient(url, serviceKey);
}

export async function confirmBookingPayment(
  bookingId: string,
  stripeSessionId?: string,
): Promise<{ confirmedBookingIds: string[]; booking: BookingRow }> {
  const supabase = getServiceSupabase();

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error('Marcação não encontrada.');
  }

  if (
    booking.payment_status === 'paid' &&
    (booking.status === 'confirmed' || booking.status === 'completed')
  ) {
    return { confirmedBookingIds: [], booking: booking as BookingRow };
  }

  const updatePayload: Record<string, string> = { payment_status: 'paid' };
  if (stripeSessionId) {
    updatePayload.stripe_session_id = stripeSessionId;
  }

  const { data: paidBooking, error: paymentError } = await supabase
    .from('bookings')
    .update(updatePayload)
    .eq('id', bookingId)
    .select('*')
    .single();

  if (paymentError || !paidBooking) {
    throw new Error('Não foi possível confirmar o pagamento.');
  }

  const parsedMeta = parseBookingMeta(paidBooking.observations);
  if (!parsedMeta || parsedMeta.mode !== 'group' || !parsedMeta.groupId) {
    const { error: statusError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId);

    if (statusError) {
      throw new Error('Pagamento confirmado, mas sem atualizar estado da marcação.');
    }

    return { confirmedBookingIds: [bookingId], booking: paidBooking as BookingRow };
  }

  const { data: groupBookings, error: groupError } = await supabase
    .from('bookings')
    .select('*')
    .eq('date', paidBooking.date)
    .eq('time_slot', paidBooking.time_slot)
    .like('observations', `%group=${parsedMeta.groupId}%`);

  if (groupError || !groupBookings) {
    throw new Error('Pagamento confirmado, mas sem acesso ao grupo da marcação.');
  }

  const allPaid = groupBookings.every((item) =>
    item.id === bookingId ? true : item.payment_status === 'paid',
  );

  if (!allPaid) {
    return { confirmedBookingIds: [], booking: paidBooking as BookingRow };
  }

  const groupIds = groupBookings.map((item) => item.id);
  const { error: confirmGroupError } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .in('id', groupIds);

  if (confirmGroupError) {
    throw new Error('Todos os pagamentos foram concluídos, mas o grupo não foi confirmado.');
  }

  return { confirmedBookingIds: groupIds, booking: paidBooking as BookingRow };
}
