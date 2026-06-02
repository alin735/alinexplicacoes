import { NextRequest, NextResponse } from 'next/server';
import { requireTutorFromRequest, tutorAuthErrorStatus } from '@/lib/server-tutor-auth';
import { getServiceSupabase } from '@/lib/server-bookings';
import {
  compareAvailableSlots,
  formatDateInputValue,
  getTodayDateInputValue,
  parseDateInputValue,
} from '@/lib/slots';

type TimeSlotInput = { start?: string; end?: string };

type CreateSlotsBody =
  | { mode: 'single'; date: string; startTime: string; endTime: string }
  | {
      mode: 'bulk';
      startDate: string;
      endDate: string;
      days: number[];
      timeSlots: TimeSlotInput[];
    };

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.';
  return NextResponse.json({ error: message }, { status: tutorAuthErrorStatus(message) });
}

// GET — lista os horários futuros do explicador autenticado.
export async function GET(req: NextRequest) {
  try {
    const { tutor } = await requireTutorFromRequest(req);
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('available_slots')
      .select('*')
      .eq('tutor_id', tutor.id)
      .gte('date', getTodayDateInputValue())
      .order('date')
      .order('start_time');

    if (error) {
      return NextResponse.json({ error: 'Não foi possível carregar os horários.' }, { status: 500 });
    }

    const slots = (data || []).sort(compareAvailableSlots);
    return NextResponse.json({ slots });
  } catch (error) {
    return handleError(error);
  }
}

// POST — cria horários (individual ou em massa) para o explicador autenticado.
export async function POST(req: NextRequest) {
  try {
    const { tutor } = await requireTutorFromRequest(req);
    const supabase = getServiceSupabase();
    const body = (await req.json()) as CreateSlotsBody;

    let rows: Array<{ date: string; start_time: string; end_time: string; tutor_id: string }> = [];

    if (body.mode === 'single') {
      if (!body.date || !body.startTime || !body.endTime) {
        return NextResponse.json({ error: 'Preenche a data e as horas do horário.' }, { status: 400 });
      }
      rows = [
        {
          date: body.date,
          start_time: body.startTime,
          end_time: body.endTime,
          tutor_id: tutor.id,
        },
      ];
    } else if (body.mode === 'bulk') {
      if (!body.startDate || !body.endDate || !Array.isArray(body.days) || body.days.length === 0) {
        return NextResponse.json({ error: 'Preenche as datas e os dias da semana.' }, { status: 400 });
      }
      const validSlots = (body.timeSlots || []).filter((slot) => slot.start && slot.end);
      if (validSlots.length === 0) {
        return NextResponse.json({ error: 'Adiciona pelo menos um horário.' }, { status: 400 });
      }

      const start = parseDateInputValue(body.startDate);
      const end = parseDateInputValue(body.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (body.days.includes(d.getDay())) {
          const dateStr = formatDateInputValue(d);
          for (const slot of validSlots) {
            rows.push({
              date: dateStr,
              start_time: slot.start as string,
              end_time: slot.end as string,
              tutor_id: tutor.id,
            });
          }
        }
      }

      if (rows.length === 0) {
        return NextResponse.json(
          { error: 'Com as datas e os dias selecionados, não existem horários para criar.' },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
    }

    const { data, error } = await supabase.from('available_slots').insert(rows).select('id');
    if (error) {
      return NextResponse.json({ error: 'Não foi possível criar os horários.' }, { status: 500 });
    }

    return NextResponse.json({ created: data?.length ?? rows.length });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE — remove um horário do explicador autenticado (?id=...).
export async function DELETE(req: NextRequest) {
  try {
    const { tutor } = await requireTutorFromRequest(req);
    const supabase = getServiceSupabase();
    const slotId = req.nextUrl.searchParams.get('id');

    if (!slotId) {
      return NextResponse.json({ error: 'Falta o identificador do horário.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('available_slots')
      .delete()
      .eq('id', slotId)
      .eq('tutor_id', tutor.id)
      .select('id')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Não foi possível remover o horário.' }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Horário não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
