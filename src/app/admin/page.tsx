'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase';
import { SUBJECTS } from '@/lib/types';
import type { Profile, Booking, AvailableSlot } from '@/lib/types';

type Tab = 'lessons' | 'bookings' | 'slots';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('lessons');
  const [students, setStudents] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Lesson form
  const [lessonStudentId, setLessonStudentId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonSubject, setLessonSubject] = useState('');
  const [lessonDate, setLessonDate] = useState('');
  const [lessonObservations, setLessonObservations] = useState('');
  const [lessonFiles, setLessonFiles] = useState<File[]>([]);
  const [submittingLesson, setSubmittingLesson] = useState(false);

  // Slot form
  const [slotDate, setSlotDate] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('');
  const [slotEndTime, setSlotEndTime] = useState('');
  const [submittingSlot, setSubmittingSlot] = useState(false);
  const [existingSlots, setExistingSlots] = useState<AvailableSlot[]>([]);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!prof?.is_admin) { router.push('/'); return; }

      setUser(user);
      setProfile(prof);

      // Fetch students
      const { data: studs } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      setStudents(studs || []);

      // Fetch bookings
      const { data: bks } = await supabase
        .from('bookings')
        .select('*, profiles(*)')
        .order('date', { ascending: false });
      setBookings(bks || []);

      // Fetch slots
      const { data: slotsData } = await supabase
        .from('available_slots')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date')
        .order('start_time');
      setExistingSlots(slotsData || []);

      setLoading(false);
    };
    init();
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') { setSuccessMsg(msg); setErrorMsg(''); }
    else { setErrorMsg(msg); setSuccessMsg(''); }
    setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 4000);
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonStudentId || !lessonTitle || !lessonSubject || !lessonDate) {
      showMessage('Preenche todos os campos obrigatórios.', 'error');
      return;
    }

    setSubmittingLesson(true);
    try {
      // Create lesson
      const { data: lesson, error: lessonErr } = await supabase
        .from('lessons')
        .insert({
          student_id: lessonStudentId,
          title: lessonTitle,
          subject: lessonSubject,
          date: lessonDate,
          observations: lessonObservations,
          created_by: user.id,
        })
        .select()
        .single();

      if (lessonErr) throw lessonErr;

      // Upload attachments
      for (const file of lessonFiles) {
        const filePath = `${lesson.id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from('lesson-files')
          .upload(filePath, file);

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('lesson-files')
            .getPublicUrl(filePath);

          await supabase.from('lesson_attachments').insert({
            lesson_id: lesson.id,
            file_name: file.name,
            file_url: urlData.publicUrl,
          });
        }
      }

      showMessage('Aula criada com sucesso!', 'success');
      setLessonStudentId('');
      setLessonTitle('');
      setLessonSubject('');
      setLessonDate('');
      setLessonObservations('');
      setLessonFiles([]);
    } catch (err: any) {
      showMessage(err.message || 'Erro ao criar aula.', 'error');
    } finally {
      setSubmittingLesson(false);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotDate || !slotStartTime || !slotEndTime) {
      showMessage('Preenche todos os campos.', 'error');
      return;
    }

    setSubmittingSlot(true);
    try {
      const { data, error } = await supabase
        .from('available_slots')
        .insert({
          date: slotDate,
          start_time: slotStartTime,
          end_time: slotEndTime,
        })
        .select()
        .single();

      if (error) throw error;

      setExistingSlots([...existingSlots, data]);
      showMessage('Horário criado com sucesso!', 'success');
      setSlotStartTime('');
      setSlotEndTime('');
    } catch (err: any) {
      showMessage(err.message || 'Erro ao criar horário.', 'error');
    } finally {
      setSubmittingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    await supabase.from('available_slots').delete().eq('id', slotId);
    setExistingSlots(existingSlots.filter((s) => s.id !== slotId));
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', bookingId);
    setBookings(bookings.map((b) => b.id === bookingId ? { ...b, status: status as any } : b));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="animate-spin w-8 h-8 border-4 border-[#3498db] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#f0f4f8]">
        <div className="bg-gradient-to-r from-[#0d2f4a] to-[#1a5276] py-12 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              ⚙️ Administração
            </h1>
            <p className="text-white/60">
              Gere aulas, marcações e horários.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Messages */}
          {successMsg && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm animate-fade-in-up">
              ✅ {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-fade-in-up">
              ❌ {errorMsg}
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-white rounded-xl p-1 shadow-sm mb-8">
            {[
              { key: 'lessons' as Tab, label: '📚 Criar aula', },
              { key: 'bookings' as Tab, label: '📅 Marcações', },
              { key: 'slots' as Tab, label: '🕐 Horários', },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Create Lesson Tab */}
          {activeTab === 'lessons' && (
            <form onSubmit={handleCreateLesson} className="bg-white rounded-2xl shadow-md p-8 space-y-6 animate-fade-in-up">
              <h2 className="text-xl font-bold text-[#0d2f4a]">Criar nova aula</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Aluno *</label>
                  <select
                    value={lessonStudentId}
                    onChange={(e) => setLessonStudentId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-[#f0f4f8] text-sm"
                    required
                  >
                    <option value="">Seleciona o aluno</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name || s.username} {s.is_admin ? '(Admin)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Disciplina *</label>
                  <select
                    value={lessonSubject}
                    onChange={(e) => setLessonSubject(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-[#f0f4f8] text-sm"
                    required
                  >
                    <option value="">Seleciona a disciplina</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Título da aula *</label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-[#f0f4f8] text-sm"
                    placeholder="Ex: Funções quadráticas"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
                  <input
                    type="date"
                    value={lessonDate}
                    onChange={(e) => setLessonDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-[#f0f4f8] text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
                <textarea
                  value={lessonObservations}
                  onChange={(e) => setLessonObservations(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-[#f0f4f8] text-sm resize-none"
                  placeholder="Sumário da aula, conteúdos abordados, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">📎 Anexos</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setLessonFiles(Array.from(e.target.files || []))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-[#f0f4f8] text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#3498db]/10 file:text-[#3498db] hover:file:bg-[#3498db]/20"
                />
                {lessonFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {lessonFiles.map((f, i) => (
                      <span key={i} className="text-xs bg-[#3498db]/10 text-[#3498db] px-3 py-1 rounded-full">
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submittingLesson}
                className="w-full py-4 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {submittingLesson ? 'A criar...' : 'Criar aula'}
              </button>
            </form>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-4 animate-fade-in-up">
              {bookings.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-10 text-center">
                  <p className="text-gray-400">Sem marcações.</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-2xl shadow-md p-5">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="font-semibold text-[#0d2f4a]">
                          {booking.profiles?.full_name || booking.profiles?.username || 'Aluno'}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs bg-[#3498db]/10 text-[#3498db] px-2 py-0.5 rounded-full font-medium">
                            {booking.subject}
                          </span>
                          <span className="text-xs text-gray-400">{booking.date}</span>
                          <span className="text-xs text-gray-400">{booking.time_slot}</span>
                        </div>
                        {booking.observations && (
                          <p className="text-xs text-gray-500 mt-2">{booking.observations}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                          booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {booking.status === 'pending' ? '⏳ Pendente' :
                           booking.status === 'confirmed' ? '✅ Confirmada' :
                           booking.status === 'completed' ? '🎉 Concluída' :
                           '❌ Cancelada'}
                        </span>

                        <select
                          value={booking.status}
                          onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-[#3498db]"
                        >
                          <option value="pending">Pendente</option>
                          <option value="confirmed">Confirmada</option>
                          <option value="completed">Concluída</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Slots Tab */}
          {activeTab === 'slots' && (
            <div className="space-y-8 animate-fade-in-up">
              <form onSubmit={handleCreateSlot} className="bg-white rounded-2xl shadow-md p-8">
                <h2 className="text-xl font-bold text-[#0d2f4a] mb-6">Adicionar horário disponível</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Data</label>
                    <input
                      type="date"
                      value={slotDate}
                      onChange={(e) => setSlotDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3498db] bg-[#f0f4f8] text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora início</label>
                    <input
                      type="time"
                      value={slotStartTime}
                      onChange={(e) => setSlotStartTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3498db] bg-[#f0f4f8] text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora fim</label>
                    <input
                      type="time"
                      value={slotEndTime}
                      onChange={(e) => setSlotEndTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3498db] bg-[#f0f4f8] text-sm"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submittingSlot}
                  className="mt-4 px-8 py-3 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm"
                >
                  {submittingSlot ? 'A adicionar...' : 'Adicionar horário'}
                </button>
              </form>

              {/* Existing slots */}
              <div>
                <h3 className="text-lg font-bold text-[#0d2f4a] mb-4">Horários futuros</h3>
                {existingSlots.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-md p-10 text-center">
                    <p className="text-gray-400">Sem horários futuros.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {existingSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`bg-white rounded-xl shadow-sm p-4 flex items-center justify-between ${
                          slot.is_booked ? 'opacity-50' : ''
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#0d2f4a]">{slot.date}</p>
                          <p className="text-xs text-gray-400">
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            {slot.is_booked && ' (Reservado)'}
                          </p>
                        </div>
                        {!slot.is_booked && (
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
