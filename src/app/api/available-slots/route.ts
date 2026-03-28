import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import {
  compareAvailableSlots,
  filterBookableSlots,
  formatDateInputValue,
  parseDateInputValue,
} from '@/lib/slots';

export async function GET(req: NextRequest) {
  try {
    const month = req.nextUrl.searchParams.get('month');
    const supabase = getServiceSupabase();

    let fromDate = formatDateInputValue(new Date());
    let toDate: string | null = null;

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, monthIndex] = month.split('-').map(Number);
      const startOfMonth = parseDateInputValue(`${year}-${String(monthIndex).padStart(2, '0')}-01`);
      const endOfMonth = new Date(year, monthIndex, 0);
      fromDate = formatDateInputValue(startOfMonth);
      toDate = formatDateInputValue(endOfMonth);
    }

    let query = supabase
      .from('available_slots')
      .select('*')
      .eq('is_booked', false)
      .gte('date', fromDate);

    if (toDate) {
      query = query.lte('date', toDate);
    }

    const { data, error } = await query.order('date').order('start_time');
    if (error) {
      return NextResponse.json({ error: 'Não foi possível carregar os horários disponíveis.' }, { status: 500 });
    }

    const visibleSlots = filterBookableSlots(data || []).sort(compareAvailableSlots);
    return NextResponse.json({ slots: visibleSlots });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao carregar os horários disponíveis.' },
      { status: 500 },
    );
  }
}
