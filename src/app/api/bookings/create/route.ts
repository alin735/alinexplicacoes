import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  ADMIN_EMAIL,
  adminBookingCreatedEmailTemplate,
  inPersonPendingReviewEmailTemplate,
  sendEmail,
} from '@/lib/email';
import {
  BookingMode,
  composeBookingObservations,
  getInviteCodeFromUserId,
  getPricePerStudentCents,
  normalizeInviteCode,
  type BookingMeta,
} from '@/lib/booking-utils';
import { getServiceSupabase } from '@/lib/server-bookings';

type CreateBookingRequest = {
  subject: string;
  schoolYear: string;
  topic: string;
  date: string;
  timeSlot: string;
  observations?: string;
  paymentMethod: 'online' | 'in_person';
  bookingMode: BookingMode;
  inviteCodes?: string[];
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
      paymentMethod,
      bookingMode,
      inviteCodes = [],
    } = body;

    if (!subject || !schoolYear || !topic || !date || !timeSlot || !paymentMethod || !bookingMode) {
      return NextResponse.json({ error: 'Dados incompletos para marcação.' }, { status: 400 });
    }

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
    const pricePerStudent = getPricePerStudentCents(groupSize);
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

    const bookingRows = participantIds.map((participantId) => ({
      student_id: participantId,
      subject,
      date,
      time_slot: `${selectedSlot.start_time}-${selectedSlot.end_time}`,
      observations: fullObservations,
      status: 'pending' as const,
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

    const { data: hostProfile } = await serviceSupabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', hostUser.id)
      .single();

    const hostName = hostProfile?.full_name || hostProfile?.username || hostUser.email || 'Aluno';

    let notificationWarning: string | null = null;
    try {
      if (paymentMethod === 'in_person') {
        const inPersonStudentHtml = inPersonPendingReviewEmailTemplate(
          hostName,
          subject,
          date,
          ownBooking.time_slot,
        );
        if (hostUser.email) {
          await sendEmail(
            hostUser.email,
            `Marcação registada para validação — ${subject}`,
            inPersonStudentHtml,
          );
        }
      }

      const adminHtml = adminBookingCreatedEmailTemplate(
        hostName,
        subject,
        date,
        ownBooking.time_slot,
        paymentMethod,
        bookingMode,
        groupSize,
      );
      await sendEmail(
        ADMIN_EMAIL,
        `Nova marcação — ${hostName} · ${subject}`,
        adminHtml,
      );
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
