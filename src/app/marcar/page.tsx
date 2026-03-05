'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase';
import { SUBJECTS, LESSON_PRICE_DISPLAY, type AvailableSlot } from '@/lib/types';
import MathRain from '@/components/MathRain';

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

type PaymentStep = 'form' | 'payment' | 'in_person_success';

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
  const [error, setError] = useState('');
  const [step, setStep] = useState<PaymentStep>('form');
  const [processingPayment, setProcessingPayment] = useState(false);
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
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const hasSlots = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return slots.some((s) => s.date === dateStr);
  };

  const getSlotsForDate = (dateStr: string) => slots.filter((s) => s.date === dateStr);

  // Advance to payment step
  const handleSubmit = () => {
    if (!subject || !selectedDate || !selectedSlot) {
      setError('Preenche todos os campos obrigatórios.');
      return;
    }
    setError('');
    setStep('payment');
  };

  // Create booking + redirect to Stripe
  const handlePayOnline = async () => {
    if (!selectedDate || !selectedSlot) return;
    setProcessingPayment(true);
    setError('');

    try {
      // Create booking with pending payment
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          student_id: user.id,
          subject,
          date: selectedDate,
          time_slot: selectedSlot,
          observations,
          status: 'pending',
          payment_method: 'online',
          payment_status: 'pending_payment',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Mark slot as booked
      const slot = slots.find(
        (s) => s.date === selectedDate && `${s.start_time}-${s.end_time}` === selectedSlot
      );
      if (slot) {
        await supabase.from('available_slots').update({ is_booked: true }).eq('id', slot.id);
      }

      // Create Stripe checkout session
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          subject,
          date: selectedDate,
          timeSlot: selectedSlot,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar sessão de pagamento');

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento.');
      setProcessingPayment(false);
    }
  };

  // Create booking with in-person payment
  const handlePayInPerson = async () => {
    if (!selectedDate || !selectedSlot) return;
    setProcessingPayment(true);
    setError('');

    try {
      const { error: bookingError } = await supabase.from('bookings').insert({
        student_id: user.id,
        subject,
        date: selectedDate,
        time_slot: selectedSlot,
        observations,
        status: 'pending',
        payment_method: 'in_person',
        payment_status: 'pending_payment',
      });

      if (bookingError) throw bookingError;

      // Mark slot as booked
      const slot = slots.find(
        (s) => s.date === selectedDate && `${s.start_time}-${s.end_time}` === selectedSlot
      );
      if (slot) {
        await supabase.from('available_slots').update({ is_booked: true }).eq('id', slot.id);
        setSlots((prev) => prev.filter((s) => s.id !== slot.id));
      }

      setStep('in_person_success');
    } catch (err: any) {
      setError(err.message || 'Erro ao marcar explicação.');
    } finally {
      setProcessingPayment(false);
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

  // In-person success state
  if (step === 'in_person_success') {
    return (
      <>
        <Navbar />
        <main className="pt-20 min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-[#3498db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#0d2f4a] mb-3">Marcação registada!</h2>
            <p className="text-gray-500 mb-3">
              A tua explicação de <strong>{subject}</strong> foi marcada para{' '}
              <strong>{selectedDate}</strong> às <strong>{selectedSlot?.replace('-', ' - ')}</strong>.
            </p>
            <p className="text-sm text-gray-400 mb-8">
              A marcação será confirmada assim que o pagamento presencial for validado pelo Alin.
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
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Payment method selection step
  if (step === 'payment') {
    return (
      <>
        <Navbar />
        <main className="pt-20 min-h-screen bg-[#f0f4f8]">
          <div className="relative bg-gradient-to-r from-[#0d2f4a] to-[#1a5276] py-12 px-4 overflow-hidden">
            <MathRain />
            <div className="relative z-10 max-w-4xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Pagamento</h1>
              <p className="text-white/60">Escolhe o método de pagamento para confirmar a marcação.</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-4 py-10">
            {/* Booking summary */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6 animate-fade-in-up">
              <h3 className="font-semibold text-[#0d2f4a] mb-4">📋 Resumo da marcação</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Disciplina</span>
                  <p className="font-medium text-[#0d2f4a]">{subject}</p>
                </div>
                <div>
                  <span className="text-gray-400">Data</span>
                  <p className="font-medium text-[#0d2f4a]">{selectedDate}</p>
                </div>
                <div>
                  <span className="text-gray-400">Horário</span>
                  <p className="font-medium text-[#0d2f4a]">{selectedSlot?.replace('-', ' - ')}</p>
                </div>
                <div>
                  <span className="text-gray-400">Valor</span>
                  <p className="font-bold text-[#3498db] text-lg">{LESSON_PRICE_DISPLAY}</p>
                </div>
              </div>
              {observations && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-gray-400 text-sm">Observações</span>
                  <p className="text-sm text-gray-600 mt-1">{observations}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-fade-in-up">
                {error}
              </div>
            )}

            {/* Payment options */}
            <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              {/* Online payment */}
              <button
                onClick={handlePayOnline}
                disabled={processingPayment}
                className="w-full bg-white rounded-2xl shadow-md p-6 text-left hover:shadow-lg hover:ring-2 hover:ring-[#3498db]/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#3498db] to-[#1a5276] rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#0d2f4a] text-lg group-hover:text-[#3498db] transition-colors">
                      {processingPayment ? 'A processar...' : 'Pagar agora'}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Cartão de crédito/débito · Confirmação imediata
                    </p>
                  </div>
                  <div className="text-[#3498db] font-bold text-lg">{LESSON_PRICE_DISPLAY}</div>
                </div>
              </button>

              {/* In-person payment */}
              <button
                onClick={handlePayInPerson}
                disabled={processingPayment}
                className="w-full bg-white rounded-2xl shadow-md p-6 text-left hover:shadow-lg hover:ring-2 hover:ring-amber-400/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#0d2f4a] text-lg group-hover:text-amber-600 transition-colors">
                      Pagarei pessoalmente
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Paga em mão ao Alin · Confirmação após validação
                    </p>
                  </div>
                  <div className="text-amber-600 font-bold text-lg">{LESSON_PRICE_DISPLAY}</div>
                </div>
              </button>
            </div>

            {/* Back button */}
            <button
              onClick={() => { setStep('form'); setError(''); }}
              disabled={processingPayment}
              className="mt-6 flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mx-auto disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao formulário
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Main form step
  const days = getDaysInMonth();

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#f0f4f8]">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#0d2f4a] to-[#1a5276] py-12 px-4 overflow-hidden">
          <MathRain />
          <div className="relative z-10 max-w-6xl mx-auto text-center">
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
                    <option key={s} value={s}>{s}</option>
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
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Valor:</strong> <span className="text-[#3498db] font-bold">{LESSON_PRICE_DISPLAY}</span>
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
                Marcar explicação
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
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
                  ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const available = hasSlots(day);
                    const isSelected = selectedDate === dateStr;
                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
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
