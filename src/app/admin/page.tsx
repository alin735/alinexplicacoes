'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase';
import { SUBJECTS } from '@/lib/types';
import type { Profile, Booking, AvailableSlot, Lesson, LessonAttachment } from '@/lib/types';
import MathRain from '@/components/MathRain';

type Tab = 'lessons' | 'aulas_manage' | 'bookings' | 'slots';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
function isImageFile(fileName: string) {
  return IMAGE_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext));
}

function extractStoragePath(fileUrl: string): string | null {
  const marker = '/object/public/lesson-files/';
  const idx = fileUrl.indexOf(marker);
  if (idx !== -1) return fileUrl.substring(idx + marker.length);
  const marker2 = '/object/sign/lesson-files/';
  const idx2 = fileUrl.indexOf(marker2);
  if (idx2 !== -1) return fileUrl.substring(idx2 + marker2.length).split('?')[0];
  return null;
}

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

  // Bulk slot form
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');
  const [bulkDays, setBulkDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [bulkTimeSlots, setBulkTimeSlots] = useState([{ start: '14:00', end: '15:00' }]);

  // Slot form
  const [slotDate, setSlotDate] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('');
  const [slotEndTime, setSlotEndTime] = useState('');
  const [submittingSlot, setSubmittingSlot] = useState(false);
  const [existingSlots, setExistingSlots] = useState<AvailableSlot[]>([]);

  // Aulas management
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [aulasFilterDate, setAulasFilterDate] = useState('');
  const [aulasShowDatePicker, setAulasShowDatePicker] = useState(false);
  const [aulasFilterSubject, setAulasFilterSubject] = useState('');
  const [aulasShowSubjectPicker, setAulasShowSubjectPicker] = useState(false);
  const [aulasExpandedId, setAulasExpandedId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editObservations, setEditObservations] = useState('');
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  // Lightbox
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState('');

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

      // Fetch all lessons for management
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*, lesson_attachments(*), profiles(*)')
        .order('created_at', { ascending: false });
      if (lessonsData) {
        setAllLessons(lessonsData);
        // Generate signed URLs for image attachments
        const urls: Record<string, string> = {};
        for (const lesson of lessonsData) {
          if (lesson.lesson_attachments) {
            for (const att of lesson.lesson_attachments) {
              const path = extractStoragePath(att.file_url);
              if (path) {
                const { data: signedData } = await supabase.storage
                  .from('lesson-files')
                  .createSignedUrl(path, 3600);
                if (signedData?.signedUrl) {
                  urls[att.id] = signedData.signedUrl;
                }
              }
            }
          }
        }
        setSignedUrls(urls);
      }

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

  const calculateBulkCount = () => {
    if (!bulkStartDate || !bulkEndDate) return 0;
    let count = 0;
    const start = new Date(bulkStartDate);
    const end = new Date(bulkEndDate);
    const validSlots = bulkTimeSlots.filter(s => s.start && s.end);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (bulkDays.includes(d.getDay())) count += validSlots.length;
    }
    return count;
  };

  const handleBulkCreateSlots = async () => {
    if (!bulkStartDate || !bulkEndDate || bulkDays.length === 0) {
      showMessage('Preenche todos os campos do bulk.', 'error');
      return;
    }
    const validSlots = bulkTimeSlots.filter(s => s.start && s.end);
    if (validSlots.length === 0) { showMessage('Adiciona pelo menos um horário.', 'error'); return; }

    setSubmittingSlot(true);
    try {
      const slotsToInsert: any[] = [];
      const start = new Date(bulkStartDate);
      const end = new Date(bulkEndDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (bulkDays.includes(d.getDay())) {
          const dateStr = d.toISOString().split('T')[0];
          for (const slot of validSlots) {
            slotsToInsert.push({ date: dateStr, start_time: slot.start, end_time: slot.end });
          }
        }
      }

      const { data, error } = await supabase.from('available_slots').insert(slotsToInsert).select();
      if (error) throw error;

      setExistingSlots(prev => [...prev, ...(data || [])].sort((a, b) => a.date.localeCompare(b.date)));
      showMessage(`${slotsToInsert.length} horários criados com sucesso!`, 'success');
      setBulkStartDate('');
      setBulkEndDate('');
    } catch (err: any) {
      showMessage(err.message || 'Erro ao criar horários em massa.', 'error');
    } finally {
      setSubmittingSlot(false);
    }
  };

  const getAttachmentUrl = (att: LessonAttachment) => signedUrls[att.id] || att.file_url;

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Tens a certeza que queres eliminar esta aula?')) return;
    try {
      // Delete attachments from storage
      const lesson = allLessons.find(l => l.id === lessonId);
      if (lesson?.lesson_attachments) {
        for (const att of lesson.lesson_attachments) {
          const path = extractStoragePath(att.file_url);
          if (path) {
            await supabase.storage.from('lesson-files').remove([path]);
          }
        }
      }
      await supabase.from('lesson_attachments').delete().eq('lesson_id', lessonId);
      await supabase.from('lessons').delete().eq('id', lessonId);
      setAllLessons(prev => prev.filter(l => l.id !== lessonId));
      showMessage('Aula eliminada com sucesso.', 'success');
    } catch (err: any) {
      showMessage(err.message || 'Erro ao eliminar aula.', 'error');
    }
  };

  const handleEditLesson = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ title: editTitle, observations: editObservations })
        .eq('id', lessonId);
      if (error) throw error;

      // Upload new files if any
      for (const file of editFiles) {
        const filePath = `${lessonId}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from('lesson-files').upload(filePath, file);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('lesson-files').getPublicUrl(filePath);
          await supabase.from('lesson_attachments').insert({
            lesson_id: lessonId,
            file_name: file.name,
            file_url: urlData.publicUrl,
          });
        }
      }

      // Refresh lessons
      const { data: refreshed } = await supabase
        .from('lessons')
        .select('*, lesson_attachments(*), profiles(*)')
        .order('created_at', { ascending: false });
      if (refreshed) {
        setAllLessons(refreshed);
        // Regenerate signed URLs
        const urls: Record<string, string> = {};
        for (const lesson of refreshed) {
          if (lesson.lesson_attachments) {
            for (const att of lesson.lesson_attachments) {
              const path = extractStoragePath(att.file_url);
              if (path) {
                const { data: signedData } = await supabase.storage.from('lesson-files').createSignedUrl(path, 3600);
                if (signedData?.signedUrl) urls[att.id] = signedData.signedUrl;
              }
            }
          }
        }
        setSignedUrls(urls);
      }

      setEditingLessonId(null);
      setEditFiles([]);
      showMessage('Aula atualizada com sucesso.', 'success');
    } catch (err: any) {
      showMessage(err.message || 'Erro ao atualizar aula.', 'error');
    }
  };

  const handleDeleteAttachment = async (attId: string, fileUrl: string) => {
    const path = extractStoragePath(fileUrl);
    if (path) await supabase.storage.from('lesson-files').remove([path]);
    await supabase.from('lesson_attachments').delete().eq('id', attId);
    setAllLessons(prev => prev.map(l => ({
      ...l,
      lesson_attachments: l.lesson_attachments?.filter(a => a.id !== attId),
    })));
    showMessage('Anexo removido.', 'success');
  };

  const filteredAllLessons = allLessons
    .filter((lesson) => {
      if (aulasFilterDate && lesson.date !== aulasFilterDate) return false;
      if (aulasFilterSubject && lesson.subject !== aulasFilterSubject) return false;
      return true;
    });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
        <div className="relative bg-gradient-to-r from-[#0d2f4a] to-[#1a5276] py-12 px-4 overflow-hidden">
          <MathRain />
          <div className="relative z-10 max-w-5xl mx-auto text-center">
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
              { key: 'aulas_manage' as Tab, label: '📖 Aulas', },
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

          {/* Aulas Management Tab */}
          {activeTab === 'aulas_manage' && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Filter controls */}
              <div className="flex flex-wrap items-start gap-3">
                <p className="text-sm text-gray-500 mr-auto self-center">
                  <strong className="text-[#0d2f4a]">{filteredAllLessons.length}</strong>{' '}
                  {filteredAllLessons.length === 1 ? 'aula' : 'aulas'}
                </p>

                {/* Date filter */}
                <div className="relative">
                  <button
                    onClick={() => { setAulasShowDatePicker(!aulasShowDatePicker); setAulasShowSubjectPicker(false); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      aulasFilterDate
                        ? 'bg-gradient-to-r from-[#3498db] to-[#5dade2] text-white shadow-sm'
                        : 'bg-white text-gray-500 hover:text-gray-700 shadow-sm'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Data
                    {aulasFilterDate && (
                      <span onClick={(e) => { e.stopPropagation(); setAulasFilterDate(''); setAulasShowDatePicker(false); }}
                        className="ml-1 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] hover:bg-white/50 cursor-pointer">✕</span>
                    )}
                  </button>
                  {aulasShowDatePicker && (
                    <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-20 animate-fade-in-up">
                      <input type="date" value={aulasFilterDate}
                        onChange={(e) => { setAulasFilterDate(e.target.value); setAulasShowDatePicker(false); }}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none" />
                      {aulasFilterDate && (
                        <button onClick={() => { setAulasFilterDate(''); setAulasShowDatePicker(false); }}
                          className="mt-2 w-full text-xs text-red-500 hover:text-red-700 transition-colors">Limpar data</button>
                      )}
                    </div>
                  )}
                </div>

                {/* Subject filter */}
                <div className="relative">
                  <button
                    onClick={() => { setAulasShowSubjectPicker(!aulasShowSubjectPicker); setAulasShowDatePicker(false); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      aulasFilterSubject
                        ? 'bg-gradient-to-r from-[#3498db] to-[#5dade2] text-white shadow-sm'
                        : 'bg-white text-gray-500 hover:text-gray-700 shadow-sm'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Disciplina
                    {aulasFilterSubject && (
                      <span onClick={(e) => { e.stopPropagation(); setAulasFilterSubject(''); setAulasShowSubjectPicker(false); }}
                        className="ml-1 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] hover:bg-white/50 cursor-pointer">✕</span>
                    )}
                  </button>
                  {aulasShowSubjectPicker && (
                    <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 min-w-[180px] animate-fade-in-up">
                      {SUBJECTS.map((s) => (
                        <button key={s}
                          onClick={() => { setAulasFilterSubject(s); setAulasShowSubjectPicker(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            aulasFilterSubject === s ? 'bg-[#3498db]/10 text-[#3498db] font-medium' : 'text-gray-700 hover:bg-[#f0f4f8]'
                          }`}>{s}</button>
                      ))}
                      {aulasFilterSubject && (
                        <button onClick={() => { setAulasFilterSubject(''); setAulasShowSubjectPicker(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 border-t border-gray-100 transition-colors">Limpar filtro</button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Lessons list */}
              {filteredAllLessons.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-10 text-center">
                  <p className="text-gray-400">Sem aulas encontradas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAllLessons.map((lesson) => (
                    <div key={lesson.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                      <button
                        onClick={() => setAulasExpandedId(aulasExpandedId === lesson.id ? null : lesson.id)}
                        className="w-full flex items-center gap-4 p-5 text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#0d2f4a] truncate">{lesson.title}</h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs bg-[#3498db]/10 text-[#3498db] px-2 py-0.5 rounded-full font-medium">{lesson.subject}</span>
                            <span className="text-xs text-gray-400">{formatDate(lesson.date)}</span>
                            <span className="text-xs text-gray-400">· {lesson.profiles?.full_name || lesson.profiles?.username || 'Aluno'}</span>
                          </div>
                        </div>
                        <svg className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${aulasExpandedId === lesson.id ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {aulasExpandedId === lesson.id && (
                        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                          {editingLessonId === lesson.id ? (
                            /* Editing form */
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] outline-none bg-[#f0f4f8] text-sm" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                <textarea value={editObservations} onChange={(e) => setEditObservations(e.target.value)} rows={3}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3498db] outline-none bg-[#f0f4f8] text-sm resize-none" />
                              </div>

                              {/* Existing attachments */}
                              {lesson.lesson_attachments && lesson.lesson_attachments.length > 0 && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Anexos existentes</label>
                                  <div className="space-y-2">
                                    {lesson.lesson_attachments.map((att) => (
                                      <div key={att.id} className="flex items-center gap-3 bg-[#f0f4f8] rounded-xl p-3">
                                        <span className="text-sm text-gray-700 truncate flex-1">{att.file_name}</span>
                                        <button onClick={() => handleDeleteAttachment(att.id, att.file_url)}
                                          className="text-red-400 hover:text-red-600 transition-colors text-xs flex items-center gap-1">
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                          Remover
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adicionar novos anexos</label>
                                <input type="file" multiple onChange={(e) => setEditFiles(Array.from(e.target.files || []))}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-[#f0f4f8] text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#3498db]/10 file:text-[#3498db]" />
                              </div>

                              <div className="flex gap-3">
                                <button onClick={() => handleEditLesson(lesson.id)}
                                  className="px-6 py-2.5 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm">
                                  Guardar
                                </button>
                                <button onClick={() => { setEditingLessonId(null); setEditFiles([]); }}
                                  className="px-6 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-all text-sm">
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* View mode */
                            <>
                              {lesson.observations && (
                                <div>
                                  <h4 className="text-sm font-semibold text-[#0d2f4a] mb-2">📝 Observações</h4>
                                  <p className="text-sm text-gray-600 bg-[#f0f4f8] rounded-xl p-4 leading-relaxed">{lesson.observations}</p>
                                </div>
                              )}

                              {lesson.lesson_attachments && lesson.lesson_attachments.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-[#0d2f4a] mb-2">📎 Anexos</h4>
                                  <div className="space-y-2">
                                    {lesson.lesson_attachments.map((att) =>
                                      isImageFile(att.file_name) ? (
                                        <button key={att.id}
                                          onClick={() => { setLightboxSrc(getAttachmentUrl(att)); setLightboxAlt(att.file_name); }}
                                          className="block w-full rounded-xl overflow-hidden bg-[#f0f4f8] hover:ring-2 hover:ring-[#3498db]/40 transition-all cursor-zoom-in">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={getAttachmentUrl(att)} alt={att.file_name} className="w-full max-h-64 object-contain" />
                                        </button>
                                      ) : (
                                        <a key={att.id} href={getAttachmentUrl(att)} target="_blank" rel="noopener noreferrer"
                                          className="flex items-center gap-3 bg-[#f0f4f8] rounded-xl p-3 hover:bg-[#3498db]/10 transition-colors group">
                                          <svg className="w-5 h-5 text-[#3498db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                          <span className="text-sm text-gray-700 group-hover:text-[#3498db] transition-colors truncate">{att.file_name}</span>
                                        </a>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-3 pt-2">
                                <button onClick={() => { setEditingLessonId(lesson.id); setEditTitle(lesson.title); setEditObservations(lesson.observations || ''); }}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-[#3498db]/10 text-[#3498db] font-medium rounded-xl hover:bg-[#3498db]/20 transition-colors text-sm">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Editar
                                </button>
                                <button onClick={() => handleDeleteLesson(lesson.id)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-500 font-medium rounded-xl hover:bg-red-100 transition-colors text-sm">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Eliminar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
              {/* Bulk Slot Creation */}
              <div className="bg-white rounded-2xl shadow-md p-8">
                <h2 className="text-xl font-bold text-[#0d2f4a] mb-2">Disponibilidade em massa</h2>
                <p className="text-sm text-gray-500 mb-6">Seleciona um intervalo de datas, os dias da semana e os horários para gerar todos os slots de uma vez.</p>

                <div className="space-y-6">
                  {/* Date range */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">📅 Data de início</label>
                      <input
                        type="date"
                        value={bulkStartDate}
                        onChange={(e) => setBulkStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3498db] bg-[#f0f4f8] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">📅 Data de fim</label>
                      <input
                        type="date"
                        value={bulkEndDate}
                        onChange={(e) => setBulkEndDate(e.target.value)}
                        min={bulkStartDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3498db] bg-[#f0f4f8] text-sm"
                      />
                    </div>
                  </div>

                  {/* Days of week */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">📆 Dias da semana</label>
                    <div className="flex flex-wrap gap-2">
                      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, i) => {
                        const dayIndex = i + 1 === 7 ? 0 : i + 1;
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setBulkDays(prev =>
                              prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
                            )}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                              bulkDays.includes(dayIndex)
                                ? 'bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white shadow-md'
                                : 'bg-[#f0f4f8] text-gray-600 hover:bg-[#3498db]/10'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time slots */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">🕐 Horários</label>
                      <button
                        type="button"
                        onClick={() => setBulkTimeSlots(prev => [...prev, { start: '', end: '' }])}
                        className="text-xs text-[#3498db] hover:text-[#1a5276] font-medium flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Adicionar horário
                      </button>
                    </div>
                    <div className="space-y-2">
                      {bulkTimeSlots.map((slot, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => setBulkTimeSlots(prev => prev.map((s, idx) => idx === i ? { ...s, start: e.target.value } : s))}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3498db] bg-[#f0f4f8] text-sm"
                          />
                          <span className="text-gray-400 text-sm">→</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => setBulkTimeSlots(prev => prev.map((s, idx) => idx === i ? { ...s, end: e.target.value } : s))}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3498db] bg-[#f0f4f8] text-sm"
                          />
                          {bulkTimeSlots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setBulkTimeSlots(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview count */}
                  {bulkStartDate && bulkEndDate && bulkDays.length > 0 && bulkTimeSlots.some(s => s.start && s.end) && (
                    <div className="bg-[#3498db]/10 border border-[#3498db]/20 rounded-xl p-4 text-sm text-[#1a5276]">
                      📊 Vai criar <strong>{calculateBulkCount()}</strong> horários no total.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleBulkCreateSlots}
                    disabled={submittingSlot || !bulkStartDate || !bulkEndDate || bulkDays.length === 0 || !bulkTimeSlots.some(s => s.start && s.end)}
                    className="w-full py-4 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submittingSlot ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        A criar horários...
                      </span>
                    ) : '🚀 Gerar horários disponíveis'}
                  </button>
                </div>
              </div>

              {/* Single slot (quick add) */}
              <form onSubmit={handleCreateSlot} className="bg-white rounded-2xl shadow-md p-8">
                <h2 className="text-lg font-bold text-[#0d2f4a] mb-4">Adicionar horário individual</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Data</label>
                    <input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3498db] bg-[#f0f4f8] text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora início</label>
                    <input type="time" value={slotStartTime} onChange={(e) => setSlotStartTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3498db] bg-[#f0f4f8] text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora fim</label>
                    <input type="time" value={slotEndTime} onChange={(e) => setSlotEndTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3498db] bg-[#f0f4f8] text-sm" required />
                  </div>
                </div>
                <button type="submit" disabled={submittingSlot}
                  className="mt-4 px-8 py-3 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm">
                  {submittingSlot ? 'A adicionar...' : 'Adicionar horário'}
                </button>
              </form>

              {/* Existing slots */}
              <div>
                <h3 className="text-lg font-bold text-[#0d2f4a] mb-4">Horários futuros ({existingSlots.length})</h3>
                {existingSlots.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-md p-10 text-center">
                    <p className="text-gray-400">Sem horários futuros.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {existingSlots.map((slot) => (
                      <div key={slot.id} className={`bg-white rounded-xl shadow-sm p-4 flex items-center justify-between ${slot.is_booked ? 'opacity-50' : ''}`}>
                        <div>
                          <p className="text-sm font-semibold text-[#0d2f4a]">{slot.date}</p>
                          <p className="text-xs text-gray-400">
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            {slot.is_booked && ' · Reservado'}
                          </p>
                        </div>
                        {!slot.is_booked && (
                          <button onClick={() => handleDeleteSlot(slot.id)} className="text-red-400 hover:text-red-600 transition-colors">
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

      {/* Image lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setLightboxSrc(null); }}
        >
          <button onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="w-full h-full flex items-center justify-center overflow-hidden p-4 sm:p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightboxSrc} alt={lightboxAlt} className="max-w-full max-h-[90vh] object-contain rounded-lg select-none" draggable={false} />
          </div>
        </div>
      )}
    </>
  );
}
