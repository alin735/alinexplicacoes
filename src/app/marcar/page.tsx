'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase';
import {
  MATH_TOPICS_BY_YEAR,
  SUBJECTS,
  type AvailableSlot,
  type Booking,
  type SchoolYear,
} from '@/lib/types';
import {
  formatEuroFromCents,
  getInviteCodeFromUserId,
  getPricePerStudentCents,
  parseBookingMeta,
  stripBookingMeta,
  type BookingMode,
} from '@/lib/booking-utils';
import MathRain from '@/components/MathRain';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

type PaymentStep = 'form' | 'payment' | 'in_person_success';

function extractInviteCodes(input: string): string[] {
  return Array.from(new Set(
    input
      .split(/[\n,;]+/)
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean),
  ));
}

function slotDisplay(slotValue: string | null): string {
  if (!slotValue) return '--';
  const [start, end] = slotValue.split('-');
  const startShort = start?.slice(0, 5) || start;
  const endShort = end?.slice(0, 5) || end;
  return `${startShort} - ${endShort}`;
}

export default function MarcarPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [subject] = useState(SUBJECTS[0]);
  const [schoolYear, setSchoolYear] = useState<SchoolYear | ''>('');
  const [topic, setTopic] = useState('');
  const [observations, setObservations] = useState('');
  const [bookingMode, setBookingMode] = useState<BookingMode>('individual');
  const [inviteCodesInput, setInviteCodesInput] = useState('');
  const [isInfoHovered, setIsInfoHovered] = useState(false);
  const [isInfoPinned, setIsInfoPinned] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [step, setStep] = useState<PaymentStep>('form');
  const [error, setError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showInPersonConfirm, setShowInPersonConfirm] = useState(false);
  const [payingPendingId, setPayingPendingId] = useState<string | null>(null);
  const [pendingGroupBookings, setPendingGroupBookings] = useState<Booking[]>([]);

  const router = useRouter();
  const supabase = createClient();

  const availableTopics = schoolYear ? MATH_TOPICS_BY_YEAR[schoolYear] : [];
  const inviteCodes = useMemo(() => extractInviteCodes(inviteCodesInput), [inviteCodesInput]);
  const estimatedGroupSize = bookingMode === 'group' ? 1 + inviteCodes.length : 1;
  const currentPriceCents = getPricePerStudentCents(estimatedGroupSize);
  const currentPriceDisplay = formatEuroFromCents(currentPriceCents);
  const myInviteCode = user?.id ? getInviteCodeFromUserId(user.id) : '';
  const isBookingInfoOpen = isInfoHovered || isInfoPinned;

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < startOffset; i += 1) days.push(null);
    for (let i = 1; i <= daysInMonth; i += 1) days.push(i);
    return days;
  };

  const hasSlots = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return slots.some((slot) => slot.date === dateStr);
  };

  const getSlotsForDate = (dateStr: string) => slots.filter((slot) => slot.date === dateStr);

  const fetchPendingGroupBookings = async (userId: string) => {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('student_id', userId)
      .eq('status', 'pending')
      .eq('payment_status', 'pending_payment')
      .eq('payment_method', 'online')
      .order('created_at', { ascending: false });

    const pending = ((data || []) as Booking[]).filter((booking) => {
      const meta = parseBookingMeta(booking.observations);
      return meta?.mode === 'group';
    });

    setPendingGroupBookings(pending);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      let activeUser = sessionData.session?.user ?? null;

      if (!activeUser) {
        const { data: userData } = await supabase.auth.getUser();
        activeUser = userData.user ?? null;
      }

      if (!activeUser) {
        router.push('/login');
        return;
      }

      setUser(activeUser);
      setLoading(false);
      await fetchPendingGroupBookings(activeUser.id);
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

  const createBooking = async (paymentMethod: 'online' | 'in_person') => {
    if (!selectedDate || !selectedSlot || !schoolYear || !topic) {
      throw new Error('Preenche todos os campos obrigatórios.');
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error('Sessão inválida. Volta a iniciar sessão.');
    }

    const response = await fetch('/api/bookings/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        subject,
        schoolYear,
        topic,
        date: selectedDate,
        timeSlot: selectedSlot,
        observations,
        paymentMethod,
        bookingMode,
        inviteCodes,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Não foi possível criar a marcação.');
    }

    const bookedSlot = slots.find(
      (slot) =>
        slot.date === selectedDate &&
        (`${slot.start_time}-${slot.end_time}` === selectedSlot ||
          `${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}` === selectedSlot),
    );
    if (bookedSlot) {
      setSlots((prev) => prev.filter((slot) => slot.id !== bookedSlot.id));
    }

    return payload as { bookingId: string };
  };

  const handleSubmit = () => {
    if (!schoolYear || !topic || !selectedDate || !selectedSlot) {
      setError('Preenche todos os campos obrigatórios.');
      return;
    }

    if (bookingMode === 'group' && inviteCodes.length === 0) {
      setError('Indica pelo menos um código de utilizador para aula de grupo.');
      return;
    }

    setError('');
    setStep('payment');
  };

  const handlePayOnline = async () => {
    setProcessingPayment(true);
    setError('');

    try {
      const booking = await createBooking('online');

      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.bookingId }),
      });

      const checkoutPayload = await checkoutResponse.json();
      if (!checkoutResponse.ok) {
        throw new Error(checkoutPayload.error || 'Erro ao criar sessão de pagamento.');
      }

      window.location.href = checkoutPayload.url;
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento.');
      setProcessingPayment(false);
    }
  };

  const handlePayInPerson = async () => {
    setProcessingPayment(true);
    setError('');
    setShowInPersonConfirm(false);

    try {
      await createBooking('in_person');
      setStep('in_person_success');
    } catch (err: any) {
      setError(err.message || 'Erro ao marcar explicação.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePayPendingBooking = async (bookingId: string) => {
    setPayingPendingId(bookingId);
    setError('');

    try {
      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const checkoutPayload = await checkoutResponse.json();
      if (!checkoutResponse.ok) {
        throw new Error(checkoutPayload.error || 'Erro ao criar sessão de pagamento.');
      }

      window.location.href = checkoutPayload.url;
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar pagamento.');
      setPayingPendingId(null);
    }
  };

  const copyInviteCode = async () => {
    if (!myInviteCode) return;
    try {
      await navigator.clipboard.writeText(myInviteCode);
      setError('');
    } catch {
      setError('Não foi possível copiar o código.');
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

  if (step === 'in_person_success') {
    const modeText = bookingMode === 'group' ? 'aula de grupo' : 'aula individual';
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
              A tua {modeText} de <strong>{subject}</strong> foi marcada para{' '}
              <strong>{selectedDate}</strong> às <strong>{slotDisplay(selectedSlot)}</strong>.
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Ano: <strong>{schoolYear}</strong> · Tema: <strong>{topic}</strong>
            </p>
            <p className="text-sm text-gray-400 mb-8">
              A marcação será confirmada assim que os pagamentos presenciais forem validados.
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

  if (step === 'payment') {
    return (
      <>
        <Navbar />
        <main className="pt-20 min-h-screen bg-[#f0f4f8]">
          <div className="relative bg-gradient-to-r from-[#0d2f4a] to-[#1a5276] py-12 px-4 overflow-hidden">
            <MathRain />
            <div className="relative z-10 max-w-4xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Pagamento</h1>
              <p className="text-white/70">Escolhe o método para confirmar a marcação.</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-4 py-10">
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <h3 className="font-semibold text-[#0d2f4a] mb-4">📋 Resumo da marcação</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Disciplina</span>
                  <p className="font-medium text-[#0d2f4a]">{subject}</p>
                </div>
                <div>
                  <span className="text-gray-400">Ano</span>
                  <p className="font-medium text-[#0d2f4a]">{schoolYear}</p>
                </div>
                <div>
                  <span className="text-gray-400">Tema</span>
                  <p className="font-medium text-[#0d2f4a]">{topic}</p>
                </div>
                <div>
                  <span className="text-gray-400">Data</span>
                  <p className="font-medium text-[#0d2f4a]">{selectedDate}</p>
                </div>
                <div>
                  <span className="text-gray-400">Horário</span>
                  <p className="font-medium text-[#0d2f4a]">{slotDisplay(selectedSlot)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Valor por aluno</span>
                  <p className="font-bold text-[#3498db] text-lg">{currentPriceDisplay}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  <strong>Tipo de aula:</strong>{' '}
                  {bookingMode === 'group'
                    ? `Grupo (${estimatedGroupSize} participantes)`
                    : 'Individual'}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
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
                    <p className="text-sm text-gray-400 mt-0.5">Cartão de crédito/débito · Confirmação imediata</p>
                  </div>
                  <div className="text-[#3498db] font-bold text-lg">{currentPriceDisplay}</div>
                </div>
              </button>

              <button
                onClick={() => setShowInPersonConfirm(true)}
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
                    <p className="text-sm text-gray-400 mt-0.5">Confirmação após validação do pagamento</p>
                  </div>
                  <div className="text-amber-600 font-bold text-lg">{currentPriceDisplay}</div>
                </div>
              </button>
            </div>

            {showInPersonConfirm && (
              <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center px-4">
                <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
                  <h3 className="text-2xl font-bold text-[#0d2f4a] mb-4">Tem a certeza que pretende avançar?</h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    A explicação não será marcada a não ser que o pagamento pessoal tenha sido acolhido previamente com o Alin.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <button
                      onClick={() => setShowInPersonConfirm(false)}
                      disabled={processingPayment}
                      className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-60"
                    >
                      Não avançar
                    </button>
                    <button
                      onClick={() => {
                        void handlePayInPerson();
                      }}
                      disabled={processingPayment}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white font-semibold hover:shadow-lg transition-all disabled:opacity-60"
                    >
                      {processingPayment ? 'A processar...' : 'Avançar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setStep('form');
                setError('');
              }}
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

  const days = getDaysInMonth();

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#f0f4f8]">
        <div className="relative bg-gradient-to-r from-[#0d2f4a] to-[#1a5276] py-12 px-4 overflow-hidden">
          <MathRain />
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Marcar explicação</h1>
            <p className="text-white/70">Escolhe o tema, o tipo de aula, o dia e a hora.</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
          {pendingGroupBookings.length > 0 && (
            <section className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-[#0d2f4a] mb-2">Pagamentos pendentes de aulas de grupo</h2>
              <p className="text-sm text-gray-500 mb-4">
                Tens convites de grupo por pagar. A marcação só é confirmada quando todos os participantes concluírem o pagamento.
              </p>
              <div className="space-y-3">
                {pendingGroupBookings.map((booking) => {
                  const meta = parseBookingMeta(booking.observations);
                  const isHost = meta?.hostId === user?.id;
                  const notes = stripBookingMeta(booking.observations);
                  return (
                    <div key={booking.id} className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#0d2f4a]">
                          {booking.subject} · {booking.date} · {slotDisplay(booking.time_slot)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {isHost ? 'Aula criada por ti' : 'Foste convidado para esta aula'} · Grupo ({meta?.size || 2})
                        </p>
                        <p className="text-sm text-[#3498db] font-semibold mt-1">
                          Valor por aluno: {formatEuroFromCents(booking.price)}
                        </p>
                        {notes && <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{notes}</p>}
                      </div>
                      <button
                        onClick={() => handlePayPendingBooking(booking.id)}
                        disabled={payingPendingId === booking.id}
                        className="px-4 py-2.5 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-60"
                      >
                        {payingPendingId === booking.id ? 'A processar...' : 'Pagar agora'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="relative z-20">
            <div
              className="relative inline-block"
              onMouseEnter={() => setIsInfoHovered(true)}
              onMouseLeave={() => setIsInfoHovered(false)}
            >
              <button
                type="button"
                onClick={() => setIsInfoPinned((prev) => !prev)}
                aria-expanded={isBookingInfoOpen}
                aria-controls="booking-info-popover"
                className={`inline-flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                  isBookingInfoOpen
                    ? 'border-[#3498db]/50 bg-[#3498db]/10 text-[#1a5276]'
                    : 'border-[#3498db]/30 bg-white text-[#0d2f4a] hover:bg-[#f8fbff]'
                }`}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1a5276] text-white text-xs font-bold">
                  i
                </span>
                Como funciona a marcação?
              </button>

              {isBookingInfoOpen && (
                <div
                  id="booking-info-popover"
                  role="tooltip"
                  className="absolute left-0 mt-3 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#3498db]/20 bg-white p-4 shadow-2xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-[#0d2f4a]">Passos rápidos</p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInfoPinned(false);
                        setIsInfoHovered(false);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Fechar
                    </button>
                  </div>

                  <ul className="mt-3 space-y-2 text-xs text-gray-600 leading-relaxed">
                    <li>1) Escolhe no calendário o dia e a hora com vaga.</li>
                    <li>2) Seleciona o ano e o tema de Matemática.</li>
                    <li>3) Define se a aula é individual ou em grupo.</li>
                    <li>4) Se for grupo, pede aos colegas o código na aba “Conta” e cola os códigos separados por vírgula.</li>
                    <li>5) Opcionalmente, adiciona observações sobre o que queres melhorar.</li>
                    <li>6) Confirma e avança para pagamento; em grupo, a marcação só fica concluída quando todos pagarem.</li>
                  </ul>
                </div>
              )}
            </div>
          </section>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <label className="block text-sm font-semibold text-[#0d2f4a] mb-3">📚 Disciplina</label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f0f4f8] text-sm font-semibold text-[#0d2f4a]">
                  {subject}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md">
                <label className="block text-sm font-semibold text-[#0d2f4a] mb-3">🎓 Ano</label>
                <select
                  value={schoolYear}
                  onChange={(e) => {
                    setSchoolYear(e.target.value as SchoolYear | '');
                    setTopic('');
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-[#f0f4f8] text-sm font-medium appearance-none cursor-pointer"
                >
                  <option value="">Seleciona o ano</option>
                  <option value="10º">10º ano</option>
                  <option value="11º">11º ano</option>
                </select>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md">
                <label className="block text-sm font-semibold text-[#0d2f4a] mb-3">📌 Tema</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={!schoolYear}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-[#f0f4f8] text-sm font-medium appearance-none cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">{schoolYear ? 'Seleciona o tema' : 'Seleciona primeiro o ano'}</option>
                  {availableTopics.map((itemTopic) => (
                    <option key={itemTopic} value={itemTopic}>
                      {itemTopic}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0d2f4a] mb-3">👤 Tipo de marcação</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setBookingMode('individual')}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        bookingMode === 'individual'
                          ? 'bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white'
                          : 'bg-[#f0f4f8] text-gray-600 hover:bg-[#e4edf5]'
                      }`}
                    >
                      Individual
                    </button>
                    <button
                      onClick={() => setBookingMode('group')}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        bookingMode === 'group'
                          ? 'bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white'
                          : 'bg-[#f0f4f8] text-gray-600 hover:bg-[#e4edf5]'
                      }`}
                    >
                      Grupo
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-[#f8fbff] border border-[#3498db]/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">O teu código de utilizador</p>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm font-bold text-[#0d2f4a]">{myInviteCode}</code>
                    <button
                      onClick={copyInviteCode}
                      className="px-3 py-1.5 rounded-lg border border-[#3498db]/30 text-[#1a5276] text-xs font-semibold hover:bg-[#3498db]/10 transition-colors"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                {bookingMode === 'group' && (
                  <div>
                    <label className="block text-sm font-semibold text-[#0d2f4a] mb-2">
                      🔗 Códigos dos participantes
                    </label>
                    <textarea
                      rows={3}
                      value={inviteCodesInput}
                      onChange={(e) => setInviteCodesInput(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f0f4f8] text-sm focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none resize-none"
                      placeholder="Ex: MET-1A2B3C4D, MET-9F8E7D6C"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Introduz os códigos separados por vírgula. Cada participante recebe um pagamento individual.
                    </p>
                  </div>
                )}

                <div className="rounded-xl bg-[#f8fbff] border border-[#3498db]/20 p-4">
                  <p className="text-sm text-gray-600">
                    <strong>Preço por aluno:</strong>{' '}
                    <span className="text-[#3498db] font-bold">{currentPriceDisplay}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tabela: 1 aluno 15€/h · 2 alunos 12€/h · 3-4 alunos 10€/h · 5+ alunos 8€/h
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md">
                <label className="block text-sm font-semibold text-[#0d2f4a] mb-3">📝 Observações</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-[#f0f4f8] text-sm resize-none"
                  placeholder="Indica os pontos específicos que precisas de melhorar."
                />
              </div>

              {selectedDate && selectedSlot && (
                <div className="bg-gradient-to-r from-[#3498db]/10 to-[#5dade2]/10 border border-[#3498db]/20 rounded-2xl p-6 animate-fade-in-up">
                  <h3 className="font-semibold text-[#0d2f4a] mb-2">📅 Resumo</h3>
                  <p className="text-sm text-gray-600"><strong>Disciplina:</strong> {subject}</p>
                  <p className="text-sm text-gray-600"><strong>Ano:</strong> {schoolYear || 'Não selecionado'}</p>
                  <p className="text-sm text-gray-600"><strong>Tema:</strong> {topic || 'Não selecionado'}</p>
                  <p className="text-sm text-gray-600"><strong>Data:</strong> {selectedDate}</p>
                  <p className="text-sm text-gray-600"><strong>Hora:</strong> {slotDisplay(selectedSlot)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Tipo:</strong>{' '}
                    {bookingMode === 'group' ? `Grupo (${estimatedGroupSize})` : 'Individual'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Valor por aluno:</strong>{' '}
                    <span className="text-[#3498db] font-bold">{currentPriceDisplay}</span>
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
                disabled={!schoolYear || !topic || !selectedDate || !selectedSlot}
                className="w-full py-4 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white font-bold rounded-2xl text-lg hover:shadow-xl hover:shadow-[#3498db]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar para pagamento
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
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

              <div className="p-6">
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    if (!day) return <div key={index} />;
                    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const available = hasSlots(day);
                    const isSelected = selectedDate === dateStr;
                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
                    const isPast = new Date(dateStr) < new Date(new Date().toISOString().split('T')[0]);

                    return (
                      <button
                        key={index}
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

                {selectedDate && (
                  <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-in-up">
                    <h4 className="text-sm font-semibold text-[#0d2f4a] mb-3">
                      🕐 Horários disponíveis para {selectedDate}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {getSlotsForDate(selectedDate).length > 0 ? (
                        getSlotsForDate(selectedDate).map((slot) => {
                          const slotKey = `${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}`;
                          const isSelectedSlot = selectedSlot === slotKey;
                          return (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedSlot(slotKey)}
                              className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                                isSelectedSlot
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
