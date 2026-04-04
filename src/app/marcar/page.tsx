'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
import BrandIcon from '@/components/BrandIcon';
import { getTodayDateInputValue, parseDateInputValue } from '@/lib/slots';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Emails that can pay in person
const IN_PERSON_PAYMENT_EMAILS = [
  'paula.magana6@gmail.com',
  'maxfariabolotinha@gmail.com',
  'poisonsb1@gmail.com',
  'gregoryeleuterio8@gmail.com',
  'dubrovadavid1@gmail.com',
  'flo.gologan@gmail.com',
  'alincmat29@gmail.com',
  'alinciorba29@gmail.com',
].map(e => e.toLowerCase());

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
  const [showGroupDiscordCta, setShowGroupDiscordCta] = useState(false);

  const [subject] = useState(SUBJECTS[0]);
  const [schoolYear, setSchoolYear] = useState<SchoolYear | ''>('');
  const [topic, setTopic] = useState('');
  const [observations, setObservations] = useState('');
  const [bookingMode, setBookingMode] = useState<BookingMode>('individual');
  const [inviteCodesInput, setInviteCodesInput] = useState('');

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
  
  // Check if user can pay in person
  const canPayInPerson = useMemo(() => {
    if (!user?.email) return false;
    return IN_PERSON_PAYMENT_EMAILS.includes(user.email.toLowerCase());
  }, [user?.email]);

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

      setUser(activeUser);
      setLoading(false);
      if (activeUser) {
        await fetchPendingGroupBookings(activeUser.id);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => setShowGroupDiscordCta(true), 8000);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const fetchSlots = async () => {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

      try {
        const response = await fetch(`/api/available-slots?month=${monthKey}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Não foi possível carregar os horários disponíveis.');
        }

        setSlots(payload.slots || []);
      } catch {
        setSlots([]);
      }
    };

    void fetchSlots();
    const intervalId = window.setInterval(() => {
      void fetchSlots();
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [currentMonth]);

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

    if (payload.notificationWarning) {
      setError(payload.notificationWarning);
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

    if (!user) {
      router.push('/login?next=/marcar');
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
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="animate-spin w-8 h-8 border-4 border-[#000000] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (step === 'in_person_success') {
    const modeText = bookingMode === 'group' ? 'aula de grupo' : 'aula individual';
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 pt-24">
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-[#000000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#000000] mb-3">Marcação registada!</h2>
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
                className="px-6 py-3 bg-[#f5f5f5] text-[#111111] rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Início
              </button>
              <button
                onClick={() => router.push('/aulas')}
                className="px-6 py-3 bg-[#000000] text-white rounded-xl font-medium hover:shadow-lg transition-all"
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
        <main className="min-h-screen bg-[#f5f5f5]">
          <div className="relative bg-white border-b border-black/15 px-4 pb-12 pt-32 overflow-hidden">
            <MathRain speed="fast" />
            <div className="relative z-10 max-w-6xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-2">Pagamento</h1>
              <p className="text-gray-600 max-w-2xl mx-auto">Escolhe o método para confirmar a marcação.</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-4 py-10">
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <h3 className="font-semibold text-[#000000] mb-4 inline-flex items-center gap-2">
                <BrandIcon token="📋" />
                <span>Resumo da marcação</span>
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Disciplina</span>
                  <p className="font-medium text-[#000000]">{subject}</p>
                </div>
                <div>
                  <span className="text-gray-400">Ano</span>
                  <p className="font-medium text-[#000000]">{schoolYear}</p>
                </div>
                <div>
                  <span className="text-gray-400">Tema</span>
                  <p className="font-medium text-[#000000]">{topic}</p>
                </div>
                <div>
                  <span className="text-gray-400">Data</span>
                  <p className="font-medium text-[#000000]">{selectedDate}</p>
                </div>
                <div>
                  <span className="text-gray-400">Horário</span>
                  <p className="font-medium text-[#000000]">{slotDisplay(selectedSlot)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Valor por aluno</span>
                  <p className="font-bold text-[#000000] text-lg">{currentPriceDisplay}</p>
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
                className="w-full bg-white rounded-2xl shadow-md p-6 text-left hover:shadow-lg hover:ring-2 hover:ring-[#000000]/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#000000] to-[#111111] rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#000000] text-lg group-hover:text-[#000000] transition-colors">
                      {processingPayment ? 'A processar...' : 'Pagar agora'}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">Cartão de crédito/débito · Confirmação imediata</p>
                  </div>
                  <div className="text-[#000000] font-bold text-lg">{currentPriceDisplay}</div>
                </div>
              </button>

              {canPayInPerson && (
              <button
                onClick={() => setShowInPersonConfirm(true)}
                disabled={processingPayment}
                className="w-full bg-white rounded-2xl shadow-md p-6 text-left hover:shadow-lg hover:ring-2 hover:ring-black/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#111111] to-[#2a2a2a] rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#000000] text-lg group-hover:text-[#111111] transition-colors">
                      Pagarei pessoalmente
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">Confirmação após validação do pagamento</p>
                  </div>
                  <div className="text-[#111111] font-bold text-lg">{currentPriceDisplay}</div>
                </div>
              </button>
              )}
            </div>

            {showInPersonConfirm && (
              <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center px-4">
                <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
                  <h3 className="text-2xl font-bold text-[#000000] mb-4">Tem a certeza que pretende avançar?</h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    A explicação não será marcada a não ser que o pagamento pessoal tenha sido previamente acordado com o Alin.
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
                      className="px-6 py-3 rounded-xl bg-[#000000] text-white font-semibold hover:shadow-lg transition-all disabled:opacity-60"
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
      <main className="min-h-screen bg-[#f5f5f5]">
        <div className="relative bg-white border-b border-black/15 px-4 pb-12 pt-32 overflow-hidden">
          <MathRain speed="fast" />
            <div className="relative z-10 max-w-6xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-2">Explicações</h1>
              <p className="text-gray-600">Agenda uma aula com o Alin.</p>
            </div>
          </div>

        <div className="max-w-6xl mx-auto px-4 pt-6 sm:pt-8 pb-10 space-y-6">
          {pendingGroupBookings.length > 0 && (
            <section className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-[#000000] mb-2">Pagamentos pendentes de aulas de grupo</h2>
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
                        <p className="font-semibold text-[#000000]">
                          {booking.subject} · {booking.date} · {slotDisplay(booking.time_slot)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {isHost ? 'Aula criada por ti' : 'Foste convidado para esta aula'} · Grupo ({meta?.size || 2})
                        </p>
                        <p className="text-sm text-[#000000] font-semibold mt-1">
                          Valor por aluno: {formatEuroFromCents(booking.price)}
                        </p>
                        {notes && <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{notes}</p>}
                      </div>
                      <button
                        onClick={() => handlePayPendingBooking(booking.id)}
                        disabled={payingPendingId === booking.id}
                        className="px-4 py-2.5 bg-[#000000] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-60"
                      >
                        {payingPendingId === booking.id ? 'A processar...' : 'Pagar agora'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="mx-auto flex w-full max-w-4xl flex-col gap-3">
            <Link
              href="/marcar/informacoes"
              className="inline-flex items-center justify-center gap-2.5 self-center rounded-xl border border-[#000000]/25 bg-white px-5 py-2.5 text-sm font-semibold text-[#000000] transition-all hover:bg-[#fafafa]"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#111111] text-white text-xs font-bold">
                i
              </span>
              Mais informações sobre as explicações
            </Link>
          </section>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <label className="block text-sm font-semibold text-[#000000] mb-3 inline-flex items-center gap-2">
                  <BrandIcon token="📚" />
                  <span>Disciplina</span>
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm font-semibold text-[#000000]">
                  {subject}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md">
                <label className="block text-sm font-semibold text-[#000000] mb-3 inline-flex items-center gap-2">
                  <BrandIcon token="🎓" />
                  <span>Ano</span>
                </label>
                <select
                  value={schoolYear}
                  onChange={(e) => {
                    setSchoolYear(e.target.value as SchoolYear | '');
                    setTopic('');
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none bg-[#f5f5f5] text-sm font-medium appearance-none cursor-pointer"
                >
                  <option value="">Seleciona o ano</option>
                  <option value="10º">10º ano</option>
                  <option value="11º">11º ano</option>
                </select>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md">
                <label className="block text-sm font-semibold text-[#000000] mb-3 inline-flex items-center gap-2">
                  <BrandIcon token="📌" />
                  <span>Tema</span>
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={!schoolYear}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none bg-[#f5f5f5] text-sm font-medium appearance-none cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-100"
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
                  <label className="block text-sm font-semibold text-[#000000] mb-3 inline-flex items-center gap-2">
                    <BrandIcon token="👤" />
                    <span>Tipo de marcação</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setBookingMode('individual')}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        bookingMode === 'individual'
                          ? 'bg-[#000000] text-white'
                          : 'bg-[#f5f5f5] text-gray-600 hover:bg-[#e4edf5]'
                      }`}
                    >
                      Individual
                    </button>
                    <button
                      onClick={() => setBookingMode('group')}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        bookingMode === 'group'
                          ? 'bg-[#000000] text-white'
                          : 'bg-[#f5f5f5] text-gray-600 hover:bg-[#e4edf5]'
                      }`}
                    >
                      Grupo
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookingMode('group')}
                    className="mt-3 w-full rounded-xl border border-[#000000]/20 bg-gradient-to-r from-[#000000]/5 to-[#4a4a4a]/10 px-4 py-3 text-left transition-all hover:border-[#000000]/35 hover:shadow-sm"
                  >
                    <span className="block text-sm font-bold text-[#000000]">Convida amigos e poupa até 70%</span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Partilha o teu código, cria uma aula de grupo e reduz o preço por aluno até 5€/h.
                    </span>
                  </button>
                </div>

                  <div className="rounded-xl bg-[#fafafa] border border-[#000000]/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">O teu código de utilizador</p>
                    <div className="flex items-center justify-between gap-3">
                    <code className="text-sm font-bold text-[#000000]">{myInviteCode || 'Disponível após o login'}</code>
                    <button
                      onClick={copyInviteCode}
                      disabled={!myInviteCode}
                      className="px-3 py-1.5 rounded-lg border border-[#000000]/30 text-[#111111] text-xs font-semibold hover:bg-[#000000]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                {bookingMode === 'group' && (
                  <div>
                    <label className="block text-sm font-semibold text-[#000000] mb-2">
                      <span className="inline-flex items-center gap-2">
                        <BrandIcon token="🔗" />
                        <span>Códigos dos participantes</span>
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      value={inviteCodesInput}
                      onChange={(e) => setInviteCodesInput(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none resize-none"
                      placeholder="Ex: MET-1A2B3C4D, MET-9F8E7D6C"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Introduz os códigos separados por vírgula. Cada participante recebe um pagamento individual.
                    </p>
                  </div>
                )}

                <div className="rounded-xl bg-[#fafafa] border border-[#000000]/20 p-4">
                  <p className="text-sm text-gray-600">
                    <strong>Preço por aluno:</strong>{' '}
                    <span className="text-[#000000] font-bold">{currentPriceDisplay}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tabela: 1 aluno 13€/h · 2 alunos 10€/h · 3-4 alunos 8€/h · 5+ alunos 5€/h
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md">
                <label className="block text-sm font-semibold text-[#000000] mb-3 inline-flex items-center gap-2">
                  <BrandIcon token="📝" />
                  <span>Observações</span>
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none bg-[#f5f5f5] text-sm resize-none"
                  placeholder="Indica os pontos específicos que precisas de melhorar."
                />
              </div>

              {selectedDate && selectedSlot && (
                <div className="bg-gradient-to-r from-[#000000]/10 to-[#4a4a4a]/10 border border-[#000000]/20 rounded-2xl p-6 animate-fade-in-up">
                  <h3 className="font-semibold text-[#000000] mb-2 inline-flex items-center gap-2">
                    <BrandIcon token="📅" />
                    <span>Resumo</span>
                  </h3>
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
                    <span className="text-[#000000] font-bold">{currentPriceDisplay}</span>
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
                className="w-full py-4 bg-[#000000] text-white font-bold rounded-2xl text-lg hover:shadow-xl hover:shadow-[#000000]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar para pagamento
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#111111] to-[#2a2a2a] px-6 py-5 flex items-center justify-between">
                <button onClick={prevMonth} className="text-gray-600 hover:text-white transition-colors p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-white font-bold text-lg">
                  {MONTHS_PT[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button onClick={nextMonth} className="text-gray-600 hover:text-white transition-colors p-1">
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
                    const todayDate = getTodayDateInputValue();
                    const isToday = todayDate === dateStr;
                    const isPast = parseDateInputValue(dateStr) < parseDateInputValue(todayDate);

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
                            ? 'bg-gradient-to-br from-[#000000] to-[#111111] text-white shadow-lg scale-110'
                            : available && !isPast
                              ? 'hover:bg-[#000000]/10 text-[#000000] cursor-pointer'
                              : 'text-gray-300 cursor-not-allowed'
                        } ${isToday && !isSelected ? 'ring-2 ring-[#000000]/30' : ''}`}
                      >
                        {day}
                        {available && !isPast && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#000000] rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedDate && (
                  <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-in-up">
                    <h4 className="text-sm font-semibold text-[#000000] mb-3">
                      <span className="inline-flex items-center gap-2">
                        <BrandIcon token="🕐" />
                        <span>Horários disponíveis para {selectedDate}</span>
                      </span>
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
                                  ? 'bg-[#111111] text-white shadow-md'
                                  : 'bg-[#f5f5f5] text-[#000000] hover:bg-[#000000]/10'
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
                    <span className="w-2 h-2 bg-[#000000] rounded-full" />
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

      {showGroupDiscordCta && (
        <div className="fixed bottom-5 right-5 z-[60] max-w-sm w-[calc(100%-2.5rem)] bg-white rounded-2xl shadow-2xl border border-[#000000]/20 p-4 animate-fade-in-up">
          <button
            onClick={() => setShowGroupDiscordCta(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            aria-label="Fechar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <p className="text-[#000000] font-semibold text-sm mb-1">Queres participar nas aulas de grupo?</p>
          <p className="text-gray-500 text-sm mb-4">
            Entra na nossa comunidade do Discord para saber mais.
          </p>
          <a
            href="https://discord.gg/7eK2QAsp23"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gradient-to-r from-[#111111] to-[#2a2a2a] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
          >
            Entrar no Discord
          </a>
        </div>
      )}

      <Footer />
    </>
  );
}
