import { NextRequest, NextResponse } from 'next/server';
import { requireTutorFromRequest, tutorAuthErrorStatus } from '@/lib/server-tutor-auth';
import { getServiceSupabase } from '@/lib/server-bookings';
import { sendBookingConfirmationEmails } from '@/lib/booking-email-notifications';

type PatchBody = {
  bookingId?: string;
  action?: 'confirm' | 'complete' | 'cancel';
};

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.';
  return NextResponse.json({ error: message }, { status: tutorAuthErrorStatus(message) });
}

// GET — marcações do explicador autenticado (com o perfil do aluno).
export async function GET(req: NextRequest) {
  try {
    const { tutor } = await requireTutorFromRequest(req);
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('bookings')
      .select('*, profiles(*)')
      .eq('tutor_id', tutor.id)
      .order('date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Não foi possível carregar as marcações.' }, { status: 500 });
    }

    return NextResponse.json({ bookings: data || [] });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH — confirma, conclui ou cancela uma marcação do explicador.
export async function PATCH(req: NextRequest) {
  try {
    const { tutor } = await requireTutorFromRequest(req);
    const supabase = getServiceSupabase();
    const { bookingId, action } = (await req.json()) as PatchBody;

    if (!bookingId || !action) {
      return NextResponse.json({ error: 'Pedido incompleto.' }, { status: 400 });
    }

    // Garante que a marcação pertence a este explicador antes de a alterar.
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, tutor_id, date, time_slot, status')
      .eq('id', bookingId)
      .eq('tutor_id', tutor.id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: 'Não foi possível validar a marcação.' }, { status: 500 });
    }
    if (!booking) {
      return NextResponse.json({ error: 'Marcação não encontrada.' }, { status: 404 });
    }

    const nextStatus =
      action === 'confirm' ? 'confirmed' : action === 'complete' ? 'completed' : 'cancelled';

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: nextStatus })
      .eq('id', bookingId)
      .eq('tutor_id', tutor.id);

    if (updateError) {
      return NextResponse.json({ error: 'Não foi possível atualizar a marcação.' }, { status: 500 });
    }

    // Ao cancelar, liberta o horário correspondente deste explicador.
    if (action === 'cancel') {
      const [startTime, endTime] = booking.time_slot.split('-');
      await supabase
        .from('available_slots')
        .update({ is_booked: false })
        .eq('tutor_id', tutor.id)
        .eq('date', booking.date)
        .eq('start_time', startTime)
        .eq('end_time', endTime);
    }

    // Ao confirmar, avisa o aluno (e o explicador + Alin) por email.
    let notificationWarning: string | null = null;
    if (action === 'confirm') {
      try {
        await sendBookingConfirmationEmails(bookingId);
      } catch (notificationError) {
        console.error('Booking confirmed but notification failed:', notificationError);
        notificationWarning = 'A marcação foi confirmada, mas houve falha no envio de email.';
      }
    }

    return NextResponse.json({ success: true, status: nextStatus, notificationWarning });
  } catch (error) {
    return handleError(error);
  }
}
