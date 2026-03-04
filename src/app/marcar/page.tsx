'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase';
import { SUBJECTS, type AvailableSlot } from '@/lib/types';

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function MarcarPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState('');
  const [observations, setObservations] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchSlots = async () => {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data } = await supabase
        .from('available_slots')
        .select('*')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .eq('is_booked', false)
        .order('date')
        .order('start_time');

      setSlots(data || []);
    };
    if (user) fetchSlots();
  }, [user, currentMonth]);

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    // Adjust for Monday start
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const hasSlots = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return slots.some((s) => s.date === dateStr);
  };

  const getSlotsForDate = (dateStr: string) => {
    return slots.filter((s) => s.date === dateStr);
  };

  const handleSubmit = async () => {
    if (!subject || !selectedDate || !selectedSlot) {
      setError('Preenche todos os campos obrigatórios.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { error: bookingError } = await supabase.from('bookings').insert({
        student_id: user.id,
        subject,
        date: selectedDate,
        time_slot: selectedSlot,
        observations,
        status: 'pending',
      });

      if (bookingError) throw bookingError;

      // Mark slot as booked
      const slot = slots.find(
        (s) => s.date === selectedDate && `${s.start_time}-${s.end_time}` === selectedSlot
      );
      if (slot) {
        await supabase.from('available_slots').update({ is_booked: true }).eq('id', slot.id);
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao marcar explicação.');
    } finally {
      setSubmitting(false);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="animate-spin w-8 h-8 border-4 border-[#3498db] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (success) {
    return (
      <>
        <Navbar />
        <main className="pt-20 min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#0d2f4a] mb-3">Explicação marcada!</h2>
            <p className="text-gray-500 mb-8">
              A tua explicação de <strong>{subject}</strong> foi marcada para{' '}
              <strong>{selectedDate}</strong>. Vou confirmar em breve!
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-[#f0f4f8] text-[#1a5276] rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Início
              </button>
              <button
                onClick={() => router.push('/aulas')}
                className="px-6 py-3 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Minhas aulas
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const days = getDaysInMonth();

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#f0f4f8]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d2f4a] to-[#1a5276] py-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Marcar explicação
            </h1>
            <p className="text-white/60">
              Escolhe a disciplina, o dia e a hora.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left - Form */}
            <div className="space-y-6">
              {/* Subject */}
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <label className="block text-sm font-semibold text-[#0d2f4a] mb-3">
                  📚 Disciplina
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-[#f0f4f8] text-sm font-medium appearance-none cursor-pointer"
                >
                  <option value="">Seleciona uma disciplina</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Observations */}
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <label className="block text-sm font-semibold text-[#0d2f4a] mb-3">
                  📝 Observações
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-[#f0f4f8] text-sm resize-none"
                  placeholder="Indica o que gostarias de rever, dúvidas que tens, etc."
                />
              </div>

              {/* Selected slot summary */}
              {selectedDate && selectedSlot && (
                <div className="bg-gradient-to-r from-[#3498db]/10 to-[#5dade2]/10 border border-[#3498db]/20 rounded-2xl p-6 animate-fade-in-up">
                  <h3 className="font-semibold text-[#0d2f4a] mb-2">📅 Resumo</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Disciplina:</strong> {subject || 'Não selecionada'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Data:</strong> {selectedDate}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Hora:</strong> {selectedSlot}
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || !subject || !selectedDate || !selectedSlot}
                className="w-full py-4 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white font-bold rounded-2xl text-lg hover:shadow-xl hover:shadow-[#3498db]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    A marcar...
                  </span>
                ) : (
                  'Marcar explicação'
                )}
              </button>
            </div>

            {/* Right - Calendar */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              {/* Calendar header */}
              <div className="bg-gradient-to-r from-[#1a5276] to-[#2980b9] px-6 py-5 flex items-center justify-between">
                <button onClick={prevMonth} className="text-white/70 hover:text-white transition-colors p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-white font-bold text-lg">
                  {MONTHS_PT[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button onClick={nextMonth} className="text-white/70 hover:text-white transition-colors p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Calendar grid */}
              <div className="p-6">
                {/* Day names */}
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, i) => {
                    if (!day) return <div key={i} />;

                    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const available = hasSlots(day);
                    const isSelected = selectedDate === dateStr;
                    const isToday =
                      new Date().toISOString().split('T')[0] === dateStr;
                    const isPast = new Date(dateStr) < new Date(new Date().toISOString().split('T')[0]);

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (available && !isPast) {
                            setSelectedDate(dateStr);
                            setSelectedSlot(null);
                          }
                        }}
                        disabled={!available || isPast}
                        className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#3498db] to-[#1a5276] text-white shadow-lg scale-110'
                            : available && !isPast
                            ? 'hover:bg-[#3498db]/10 text-[#0d2f4a] cursor-pointer'
                            : isPast
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-300 cursor-not-allowed'
                        } ${isToday && !isSelected ? 'ring-2 ring-[#3498db]/30' : ''}`}
                      >
                        {day}
                        {available && !isPast && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#3498db] rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-in-up">
                    <h4 className="text-sm font-semibold text-[#0d2f4a] mb-3">
                      🕐 Horários disponíveis para {selectedDate}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {getSlotsForDate(selectedDate).length > 0 ? (
                        getSlotsForDate(selectedDate).map((slot) => {
                          const slotKey = `${slot.start_time}-${slot.end_time}`;
                          const isSlotSelected = selectedSlot === slotKey;
                          return (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedSlot(slotKey)}
                              className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                                isSlotSelected
                                  ? 'bg-gradient-to-r from-[#3498db] to-[#5dade2] text-white shadow-md'
                                  : 'bg-[#f0f4f8] text-[#0d2f4a] hover:bg-[#3498db]/10'
                              }`}
                            >
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </button>
                          );
                        })
                      ) : (
                        <p className="col-span-2 text-sm text-gray-400 text-center py-4">
                          Sem horários disponíveis para este dia.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="px-6 pb-6">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#3498db] rounded-full" />
                    Disponível
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-gray-300 rounded-full" />
                    Indisponível
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
