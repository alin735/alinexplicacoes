'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import { createClient } from '@/lib/supabase';
import { getTutorById } from '@/lib/tutors';
import { formatEuroFromCents, parseBookingMeta, stripBookingMeta } from '@/lib/booking-utils';
import {
  compareAvailableSlots,
  getTodayDateInputValue,
} from '@/lib/slots';
import type { AvailableSlot, Booking, Lesson, LessonAttachment, Profile } from '@/lib/types';

type Tab = 'slots' | 'bookings' | 'create_lesson' | 'lessons';

type TimeSlotRow = { start: string; end: string };

const WEEKDAYS: Array<{ label: string; value: number }> = [
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 0 },
];

function slotLabel(value: string | null): string {
  if (!value) return '--';
  const [start, end] = value.split('-');
  return `${start?.slice(0, 5) || start} - ${end?.slice(0, 5) || end}`;
}

export default function ExplicadorPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tutorName, setTutorName] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('slots');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Slots
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [singleDate, setSingleDate] = useState('');
  const [singleStart, setSingleStart] = useState('');
  const [singleEnd, setSingleEnd] = useState('');
  const [bulkStart, setBulkStart] = useState('');
  const [bulkEnd, setBulkEnd] = useState('');
  const [bulkDays, setBulkDays] = useState<number[]>([]);
  const [bulkSlots, setBulkSlots] = useState<TimeSlotRow[]>([{ start: '', end: '' }]);
  const [savingSlots, setSavingSlots] = useState(false);

  // Bookings
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Students + create lesson
  const [students, setStudents] = useState<Profile[]>([]);
  const [lessonStudentId, setLessonStudentId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDate, setLessonDate] = useState('');
  const [lessonObservations, setLessonObservations] = useState('');
  const [lessonFiles, setLessonFiles] = useState<File[]>([]);
  const [savingLesson, setSavingLesson] = useState(false);

  // Lessons
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, [supabase]);

  const authedFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const token = await getToken();
      if (!token) throw new Error('Sessão inválida. Volta a iniciar sessão.');
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${token}`);
      return fetch(input, { ...init, headers });
    },
    [getToken],
  );

  const loadSlots = useCallback(async () => {
    const res = await authedFetch('/api/explicador/slots');
    const payload = await res.json();
    if (res.ok) setSlots((payload.slots || []).sort(compareAvailableSlots));
  }, [authedFetch]);

  const loadBookings = useCallback(async () => {
    const res = await authedFetch('/api/explicador/bookings');
    const payload = await res.json();
    if (res.ok) setBookings(payload.bookings || []);
  }, [authedFetch]);

  const loadStudents = useCallback(async () => {
    const res = await authedFetch('/api/explicador/students');
    const payload = await res.json();
    if (res.ok) setStudents(payload.students || []);
  }, [authedFetch]);

  const loadLessons = useCallback(async () => {
    const res = await authedFetch('/api/explicador/lessons');
    const payload = await res.json();
    if (res.ok) {
      setLessons(payload.lessons || []);
      setSignedUrls(payload.signedUrls || {});
    }
  }, [authedFetch]);

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      let activeUser = sessionData.session?.user ?? null;
      if (!activeUser) {
        const { data: userData } = await supabase.auth.getUser();
        activeUser = userData.user ?? null;
      }
      if (!activeUser) {
        router.push('/login?next=/explicador');
        return;
      }

      const tutor = getTutorById(activeUser.id);
      if (!tutor) {
        router.push('/');
        return;
      }

      setTutorName(tutor.name);
      setAuthorized(true);
      await Promise.all([loadSlots(), loadBookings(), loadStudents(), loadLessons()]);
      setLoading(false);
    };
    void init();
  }, [supabase, router, loadSlots, loadBookings, loadStudents, loadLessons]);

  const toggleBulkDay = (value: number) => {
    setBulkDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value],
    );
  };

  const updateBulkSlot = (index: number, key: keyof TimeSlotRow, value: string) => {
    setBulkSlots((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const handleCreateSingleSlot = async () => {
    if (!singleDate || !singleStart || !singleEnd) {
      showMessage('Preenche a data e as horas do horário.', 'error');
      return;
    }
    setSavingSlots(true);
    try {
      const res = await authedFetch('/api/explicador/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'single', date: singleDate, startTime: singleStart, endTime: singleEnd }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Erro ao criar horário.');
      showMessage('Horário criado com sucesso!', 'success');
      setSingleDate('');
      setSingleStart('');
      setSingleEnd('');
      await loadSlots();
    } catch (err: any) {
      showMessage(err.message || 'Erro ao criar horário.', 'error');
    } finally {
      setSavingSlots(false);
    }
  };

  const handleCreateBulkSlots = async () => {
    if (!bulkStart || !bulkEnd || bulkDays.length === 0) {
      showMessage('Preenche as datas e escolhe os dias da semana.', 'error');
      return;
    }
    const valid = bulkSlots.filter((s) => s.start && s.end);
    if (valid.length === 0) {
      showMessage('Adiciona pelo menos um horário.', 'error');
      return;
    }
    setSavingSlots(true);
    try {
      const res = await authedFetch('/api/explicador/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'bulk',
          startDate: bulkStart,
          endDate: bulkEnd,
          days: bulkDays,
          timeSlots: valid,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Erro ao criar horários.');
      showMessage(`${payload.created} horários criados com sucesso!`, 'success');
      setBulkStart('');
      setBulkEnd('');
      setBulkDays([]);
      setBulkSlots([{ start: '', end: '' }]);
      await loadSlots();
    } catch (err: any) {
      showMessage(err.message || 'Erro ao criar horários.', 'error');
    } finally {
      setSavingSlots(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Remover este horário?')) return;
    try {
      const res = await authedFetch(`/api/explicador/slots?id=${encodeURIComponent(slotId)}`, {
        method: 'DELETE',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Erro ao remover horário.');
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch (err: any) {
      showMessage(err.message || 'Erro ao remover horário.', 'error');
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'confirm' | 'complete' | 'cancel') => {
    if (action === 'cancel' && !confirm('Cancelar esta marcação?')) return;
    try {
      const res = await authedFetch('/api/explicador/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Erro ao atualizar marcação.');
      if (payload.notificationWarning) {
        showMessage(payload.notificationWarning, 'error');
      } else {
        showMessage('Marcação atualizada com sucesso.', 'success');
      }
      await loadBookings();
      if (action === 'cancel') await loadSlots();
    } catch (err: any) {
      showMessage(err.message || 'Erro ao atualizar marcação.', 'error');
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonStudentId || !lessonTitle || !lessonDate) {
      showMessage('Preenche todos os campos obrigatórios.', 'error');
      return;
    }
    setSavingLesson(true);
    try {
      const formData = new FormData();
      formData.append('studentId', lessonStudentId);
      formData.append('title', lessonTitle);
      formData.append('subject', 'Matemática');
      formData.append('date', lessonDate);
      formData.append('observations', lessonObservations);
      lessonFiles.forEach((file) => formData.append('files', file));

      const res = await authedFetch('/api/explicador/lessons', { method: 'POST', body: formData });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Erro ao criar aula.');

      if (payload.notificationWarning) {
        showMessage(payload.notificationWarning, 'error');
      } else {
        showMessage(`Aula criada com sucesso! (${payload.uploadedCount}/${payload.totalFiles} ficheiros)`, 'success');
      }
      setLessonStudentId('');
      setLessonTitle('');
      setLessonDate('');
      setLessonObservations('');
      setLessonFiles([]);
      await loadLessons();
    } catch (err: any) {
      showMessage(err.message || 'Erro ao criar aula.', 'error');
    } finally {
      setSavingLesson(false);
    }
  };

  const getAttachmentUrl = (att: LessonAttachment) => signedUrls[att.id] || att.file_url;

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="animate-spin w-8 h-8 border-4 border-[#000000] border-t-transparent rounded-full" />
      </div>
    );
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'slots', label: 'Horários' },
    { id: 'bookings', label: 'Marcações' },
    { id: 'create_lesson', label: 'Criar aula' },
    { id: 'lessons', label: 'Aulas' },
  ];

  const today = getTodayDateInputValue();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <div className="relative bg-white border-b border-black/15 px-4 pb-10 pt-32 overflow-hidden">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-2">Painel do Explicador</h1>
            <p className="text-gray-600">Olá, {tutorName}. Gere aqui os teus horários, marcações e aulas.</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {message && (
            <div
              className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mb-8 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#000000] text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-black/5 border border-black/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'slots' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-lg font-bold text-[#000000] mb-4">Disponibilidade em massa</h2>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#000000] mb-2">Data inicial</label>
                    <input
                      type="date"
                      value={bulkStart}
                      min={today}
                      onChange={(e) => setBulkStart(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm outline-none focus:ring-2 focus:ring-[#000000]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#000000] mb-2">Data final</label>
                    <input
                      type="date"
                      value={bulkEnd}
                      min={bulkStart || today}
                      onChange={(e) => setBulkEnd(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm outline-none focus:ring-2 focus:ring-[#000000]"
                    />
                  </div>
                </div>

                <label className="block text-sm font-semibold text-[#000000] mb-2">Dias da semana</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleBulkDay(day.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        bulkDays.includes(day.value)
                          ? 'bg-[#000000] text-white'
                          : 'bg-[#f5f5f5] text-gray-600 hover:bg-black/5'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-semibold text-[#000000] mb-2">Horários</label>
                <div className="space-y-2 mb-4">
                  {bulkSlots.map((row, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={row.start}
                        onChange={(e) => updateBulkSlot(index, 'start', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm outline-none focus:ring-2 focus:ring-[#000000]"
                      />
                      <span className="text-gray-400">até</span>
                      <input
                        type="time"
                        value={row.end}
                        onChange={(e) => updateBulkSlot(index, 'end', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm outline-none focus:ring-2 focus:ring-[#000000]"
                      />
                      {bulkSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBulkSlots((prev) => prev.filter((_, i) => i !== index))}
                          className="px-3 py-2 text-red-500 text-sm font-semibold hover:bg-red-50 rounded-xl"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setBulkSlots((prev) => [...prev, { start: '', end: '' }])}
                  className="text-sm font-semibold text-[#000000] hover:underline mb-4"
                >
                  + Adicionar horário
                </button>

                <div>
                  <button
                    type="button"
                    onClick={handleCreateBulkSlots}
                    disabled={savingSlots}
                    className="px-6 py-3 bg-[#000000] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {savingSlots ? 'A criar...' : 'Criar horários em massa'}
                  </button>
                </div>
              </section>

              <section className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-lg font-bold text-[#000000] mb-4">Horário individual</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#000000] mb-2">Data</label>
                    <input
                      type="date"
                      value={singleDate}
                      min={today}
                      onChange={(e) => setSingleDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm outline-none focus:ring-2 focus:ring-[#000000]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#000000] mb-2">Início</label>
                    <input
                      type="time"
                      value={singleStart}
                      onChange={(e) => setSingleStart(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm outline-none focus:ring-2 focus:ring-[#000000]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#000000] mb-2">Fim</label>
                    <input
                      type="time"
                      value={singleEnd}
                      onChange={(e) => setSingleEnd(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm outline-none focus:ring-2 focus:ring-[#000000]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCreateSingleSlot}
                  disabled={savingSlots}
                  className="mt-4 px-6 py-3 bg-[#000000] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {savingSlots ? 'A criar...' : 'Criar horário'}
                </button>
              </section>

              <section className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-lg font-bold text-[#000000] mb-4">Horários futuros ({slots.length})</h2>
                {slots.length === 0 ? (
                  <p className="text-sm text-gray-400">Ainda não tens horários futuros.</p>
                ) : (
                  <div className="space-y-2">
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-[#000000] text-sm">
                            {slot.date} · {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {slot.is_booked ? 'Reservado' : 'Disponível'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="px-3 py-1.5 text-red-500 text-sm font-semibold hover:bg-red-50 rounded-lg"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'bookings' && (
            <section className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-[#000000] mb-4">Marcações ({bookings.length})</h2>
              {bookings.length === 0 ? (
                <p className="text-sm text-gray-400">Ainda não tens marcações.</p>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => {
                    const meta = parseBookingMeta(booking.observations);
                    const notes = stripBookingMeta(booking.observations);
                    const studentName =
                      booking.profiles?.full_name || booking.profiles?.username || 'Aluno';
                    return (
                      <div key={booking.id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[#000000]">
                              {studentName} · {booking.subject}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {booking.date} · {slotLabel(booking.time_slot)}
                              {meta?.mode === 'group' ? ` · Grupo (${meta.size})` : ' · Individual'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatEuroFromCents(booking.price)} ·{' '}
                              {booking.payment_method === 'online' ? 'Online' : 'Presencial'} ·{' '}
                              {booking.payment_status === 'paid' ? 'Pago' : 'Por pagar'}
                            </p>
                            {notes && (
                              <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{notes}</p>
                            )}
                          </div>
                          <span
                            className={`self-start inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              booking.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : booking.status === 'completed'
                                  ? 'bg-blue-100 text-blue-700'
                                  : booking.status === 'cancelled'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {booking.status === 'confirmed'
                              ? 'Confirmada'
                              : booking.status === 'completed'
                                ? 'Concluída'
                                : booking.status === 'cancelled'
                                  ? 'Cancelada'
                                  : 'Pendente'}
                          </span>
                        </div>

                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {booking.status === 'pending' && (
                              <button
                                onClick={() => handleBookingAction(booking.id, 'confirm')}
                                className="px-4 py-2 bg-[#000000] text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all"
                              >
                                Confirmar
                              </button>
                            )}
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => handleBookingAction(booking.id, 'complete')}
                                className="px-4 py-2 bg-[#000000] text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all"
                              >
                                Concluir
                              </button>
                            )}
                            <button
                              onClick={() => handleBookingAction(booking.id, 'cancel')}
                              className="px-4 py-2 border border-red-200 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeTab === 'create_lesson' && (
            <section className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-[#000000] mb-1">Criar aula</h2>
              <p className="text-sm text-gray-500 mb-4">
                Só aparecem os alunos que já marcaram explicação contigo.
              </p>
              <form onSubmit={handleCreateLesson} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#000000] mb-2">Aluno</label>
                  <select
                    value={lessonStudentId}
                    onChange={(e) => setLessonStudentId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm outline-none focus:ring-2 focus:ring-[#000000]"
                  >
                    <option value="">
                      {students.length === 0 ? 'Ainda não tens alunos' : 'Seleciona o aluno'}
                    </option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.full_name || student.username || student.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#000000] mb-2">Título</label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm outline-none focus:ring-2 focus:ring-[#000000]"
                    placeholder="Ex: Funções — revisão"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#000000] mb-2">Data</label>
                  <input
                    type="date"
                    value={lessonDate}
                    onChange={(e) => setLessonDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm outline-none focus:ring-2 focus:ring-[#000000]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#000000] mb-2">Observações</label>
                  <textarea
                    value={lessonObservations}
                    onChange={(e) => setLessonObservations(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] text-sm outline-none focus:ring-2 focus:ring-[#000000] resize-none"
                    placeholder="Resumo da aula, próximos passos, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#000000] mb-2">Ficheiros</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setLessonFiles(Array.from(e.target.files || []))}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#000000] file:text-white file:text-sm file:font-semibold hover:file:bg-[#2a2a2a]"
                  />
                  {lessonFiles.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">{lessonFiles.length} ficheiro(s) selecionado(s)</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={savingLesson || students.length === 0}
                  className="px-6 py-3 bg-[#000000] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {savingLesson ? 'A criar...' : 'Criar aula'}
                </button>
              </form>
            </section>
          )}

          {activeTab === 'lessons' && (
            <section className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-[#000000] mb-4">Aulas publicadas ({lessons.length})</h2>
              {lessons.length === 0 ? (
                <p className="text-sm text-gray-400">Ainda não publicaste aulas.</p>
              ) : (
                <div className="space-y-3">
                  {lessons.map((lesson) => {
                    const studentName =
                      lesson.profiles?.full_name || lesson.profiles?.username || 'Aluno';
                    return (
                      <div key={lesson.id} className="border border-gray-100 rounded-xl p-4">
                        <p className="font-semibold text-[#000000]">{lesson.title}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {studentName} · {lesson.subject} · {lesson.date}
                        </p>
                        {lesson.observations && (
                          <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{lesson.observations}</p>
                        )}
                        {lesson.lesson_attachments && lesson.lesson_attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {lesson.lesson_attachments.map((att) => (
                              <a
                                key={att.id}
                                href={getAttachmentUrl(att)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f5] rounded-lg text-xs font-semibold text-[#000000] hover:bg-black/5"
                              >
                                {att.file_name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
