import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  BookingMode,
  composeBookingObservations,
  FIRST_LESSON_PRICE_CENTS,
  FIRST_LESSON_PROMO_ENABLED,
  getInviteCodeFromUserId,
  getPricePerStudentCents,
  normalizeInviteCode,
  type BookingMeta,
} from '@/lib/booking-utils';
import { sendBookingConfirmationEmails } from '@/lib/booking-email-notifications';
import { getServiceSupabase, isStudentFirstLesson } from '@/lib/server-bookings';
import { isSlotBookable } from '@/lib/slots';
import { resolveTutorOrDefault, tutorOffersFirstLessonDiscount } from '@/lib/tutors';

type CreateBookingRequest = {
  subject: string;
  schoolYear: string;
  topic: string;
  date: string;
  timeSlot: string;
  observations?: string;
  /**
   * Mantido por compatibilidade. O pagamento online foi removido das explicações;
   * os pagamentos são combinados e feitos à parte (MBWay). Quando ausente, assume-se
   * 'in_person' (pago à parte).
   */
  paymentMethod?: 'online' | 'in_person';
  bookingMode: BookingMode;
  inviteCodes?: string[];
  tutorSlug?: string;
};

function getUserClient(authHeader: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Configuração Supabase incompleta no servidor.');
  }

  return createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

function buildObservationsText(schoolYear: string, topic: string, observations: string): string {
  const lines = [`Ano: ${schoolYear}`, `Tema: ${topic}`];
  if (observations.trim()) lines.push(`Observações: ${observations.trim()}`);
  return lines.join('\n');
}

function getSlotKey(startTime: string, endTime: string): string {
  return `${startTime.slice(0, 5)}-${endTime.slice(0, 5)}`;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Sem autenticação válida.' }, { status: 401 });
    }

    const body = (await req.json()) as CreateBookingRequest;
    const {
      subject,
      schoolYear,
      topic,
      date,
      timeSlot,
      observations = '',
      paymentMethod = 'in_person',
      bookingMode,
      inviteCodes = [],
      tutorSlug,
    } = body;

    if (!subject || !schoolYear || !topic || !date || !timeSlot || !bookingMode) {
      return NextResponse.json({ error: 'Dados incompletos para marcação.' }, { status: 400 });
    }

    const tutor = resolveTutorOrDefault(tutorSlug);

    if (subject !== 'Matemática') {
      return NextResponse.json({ error: 'Só é possível marcar explicações de Matemática.' }, { status: 400 });
    }

    const userClient = getUserClient(authHeader);
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
    }

    const hostUser = authData.user;
    const serviceSupabase = getServiceSupabase();

    const { data: daySlots, error: slotsError } = await serviceSupabase
      .from('available_slots')
      .select('id, date, start_time, end_time, is_booked')
      .eq('date', date)
      .eq('tutor_id', tutor.id)
      .eq('is_booked', false);

    if (slotsError) {
      return NextResponse.json({ error: 'Não foi possível validar os horários.' }, { status: 500 });
    }

    const normalizedSlot = timeSlot.trim();
    const selectedSlot = (daySlots || []).find(
      (slot) =>
        `${slot.start_time}-${slot.end_time}` === normalizedSlot ||
        getSlotKey(slot.start_time, slot.end_time) === normalizedSlot,
    );

    if (!selectedSlot) {
      return NextResponse.json({ error: 'O horário selecionado já não está disponível.' }, { status: 409 });
    }

    if (!isSlotBookable(selectedSlot.date, selectedSlot.start_time)) {
      return NextResponse.json(
        { error: 'Este horário já não está disponível porque a aula começa em menos de 30 minutos.' },
        { status: 409 },
      );
    }

    const cleanedCodes = Array.from(
      new Set(inviteCodes.map((code) => normalizeInviteCode(code)).filter(Boolean)),
    );
    let participantIds: string[] = [hostUser.id];

    if (bookingMode === 'group') {
      if (cleanedCodes.length === 0) {
        return NextResponse.json({ error: 'Indica pelo menos um código de convite.' }, { status: 400 });
      }

      const { data: allProfiles, error: profilesError } = await serviceSupabase
        .from('profiles')
        .select('id');

      if (profilesError || !allProfiles) {
        return NextResponse.json({ error: 'Não foi possível validar os códigos dos utilizadores.' }, { status: 500 });
      }

      const codeToId = new Map<string, string>();
      for (const profile of allProfiles) {
        codeToId.set(getInviteCodeFromUserId(profile.id), profile.id);
      }

      const unresolvedCodes: string[] = [];
      const invitedIds: string[] = [];
      for (const code of cleanedCodes) {
        const resolvedId = codeToId.get(code);
        if (!resolvedId) {
          unresolvedCodes.push(code);
          continue;
        }
        if (resolvedId === hostUser.id) continue;
        invitedIds.push(resolvedId);
      }

      if (unresolvedCodes.length > 0) {
        return NextResponse.json(
          { error: `Código(s) inválido(s): ${unresolvedCodes.join(', ')}` },
          { status: 400 },
        );
      }

      if (invitedIds.length === 0) {
        return NextResponse.json(
          { error: 'Indica pelo menos um código válido diferente do teu.' },
          { status: 400 },
        );
      }

      participantIds = [hostUser.id, ...Array.from(new Set(invitedIds))];
    }

    const groupSize = participantIds.length;
    let pricePerStudent = getPricePerStudentCents(
      groupSize,
      tutor.individualPriceCents,
      tutor.twoStudentPriceCents,
    );

    // A 1.ª aula (individual) de cada aluno tem o preço de boas-vindas, exceto
    // nos explicadores que não fazem desconto de 1.ª aula (ex.: Manuel), onde a
    // primeira aula é logo o preço individual normal. A partir daí passa sempre
    // a ser o preço individual normal do explicador (combinado à parte por MBWay).
    if (
      FIRST_LESSON_PROMO_ENABLED &&
      bookingMode === 'individual' &&
      tutorOffersFirstLessonDiscount(tutor) &&
      (await isStudentFirstLesson(hostUser.id))
    ) {
      pricePerStudent = FIRST_LESSON_PRICE_CENTS;
    }
    const groupId =
      bookingMode === 'group'
        ? `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        : null;

    const meta: BookingMeta = {
      mode: bookingMode,
      groupId,
      hostId: hostUser.id,
      size: groupSize,
      participants: participantIds,
    };

    const fullObservations = composeBookingObservations(
      meta,
      buildObservationsText(schoolYear, topic, observations),
    );

    const { data: lockedSlot, error: lockError } = await serviceSupabase
      .from('available_slots')
      .update({ is_booked: true })
      .eq('id', selectedSlot.id)
      .eq('is_booked', false)
      .select('id')
      .maybeSingle();

    if (lockError || !lockedSlot) {
      return NextResponse.json({ error: 'O horário foi reservado por outro utilizador.' }, { status: 409 });
    }

    // O pagamento online foi removido: a marcação é confirmada logo que é criada.
    // O pagamento é combinado e feito à parte (MBWay).
    const bookingRows = participantIds.map((participantId) => ({
      student_id: participantId,
      tutor_id: tutor.id,
      subject,
      date,
      time_slot: `${selectedSlot.start_time}-${selectedSlot.end_time}`,
      observations: fullObservations,
      status: 'confirmed' as const,
      payment_method: paymentMethod,
      payment_status: 'pending_payment' as const,
      price: pricePerStudent,
    }));

    const { data: createdBookings, error: createError } = await serviceSupabase
      .from('bookings')
      .insert(bookingRows)
      .select('id, student_id, payment_status, status, payment_method, date, time_slot, subject, observations, price');

    if (createError || !createdBookings) {
      await serviceSupabase.from('available_slots').update({ is_booked: false }).eq('id', selectedSlot.id);
      return NextResponse.json({ error: 'Não foi possível criar a marcação.' }, { status: 500 });
    }

    const ownBooking = createdBookings.find((item) => item.student_id === hostUser.id);
    if (!ownBooking) {
      return NextResponse.json({ error: 'Marcação criada sem associação ao utilizador atual.' }, { status: 500 });
    }

    let notificationWarning: string | null = null;
    try {
      // Confirmação ao anfitrião (aluno) + notificação ao explicador e ao Alin.
      await sendBookingConfirmationEmails(ownBooking.id);

      // Para os restantes participantes de grupo, só o aluno recebe confirmação
      // (evita duplicar a notificação ao explicador e ao Alin).
      const otherBookingIds = createdBookings
        .filter((item) => item.id !== ownBooking.id)
        .map((item) => item.id);
      for (const otherId of otherBookingIds) {
        await sendBookingConfirmationEmails(otherId, { notifyTutorAndAdmin: false });
      }
    } catch (notificationError) {
      console.error('Booking created but notification email failed:', notificationError);
      notificationWarning = 'A marcação foi criada, mas houve falha no envio de notificação por email.';
    }

    return NextResponse.json({
      bookingId: ownBooking.id,
      groupSize,
      pricePerStudent,
      bookingMode,
      invitedUsers: Math.max(0, groupSize - 1),
      notificationWarning,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erro inesperado ao criar a marcação.' },
      { status: 500 },
    );
  }
}
