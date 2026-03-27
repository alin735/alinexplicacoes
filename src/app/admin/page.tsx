'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase';
import { ADMIN_LESSON_SUBJECTS } from '@/lib/types';
import type {
  Profile,
  Booking,
  AvailableSlot,
  Lesson,
  LessonAttachment,
  StudentPlan,
  StudentPlanContext,
  StudentPlanQuestionnaire,
  StudentPlanRequestStatus,
  StudentPlanTestImage,
} from '@/lib/types';
import { formatEuroFromCents, parseBookingMeta, stripBookingMeta } from '@/lib/booking-utils';
import MathRain from '@/components/MathRain';
import BrandIcon from '@/components/BrandIcon';

type Tab = 'lessons' | 'aulas_manage' | 'pedidos' | 'bookings' | 'slots' | 'plans' | 'newsletter';

type NewsletterCampaignSummary = {
  id: string;
  subject: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  created_at: string;
  sent_at: string | null;
};

type AdminStudentPlan = StudentPlan;

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

function getStudentPlanContext(plan: StudentPlan | null): StudentPlanContext {
  if (!plan?.context_json || typeof plan.context_json !== 'object') {
    return {};
  }

  return plan.context_json as StudentPlanContext;
}

function getStudentPlanStatus(plan: StudentPlan | null): StudentPlanRequestStatus {
  const status = getStudentPlanContext(plan).requestStatus;
  if (status === 'pending' || status === 'ready') return status;
  return plan?.plan_text?.trim() ? 'ready' : 'pending';
}

function getStudentPlanQuestionnaire(plan: StudentPlan | null): StudentPlanQuestionnaire | null {
  const questionnaire = getStudentPlanContext(plan).questionnaire;
  if (!questionnaire || typeof questionnaire !== 'object') return null;

  return {
    mainDifficulties: String(questionnaire.mainDifficulties || ''),
    currentActions: String(questionnaire.currentActions || ''),
    goals: String(questionnaire.goals || ''),
    studyTimeValue:
      typeof questionnaire.studyTimeValue === 'number' ? questionnaire.studyTimeValue : undefined,
    studyTimeUnit: questionnaire.studyTimeUnit === 'day' ? 'day' : 'week',
  };
}

function getStudentPlanImages(plan: StudentPlan | null): StudentPlanTestImage[] {
  const images = getStudentPlanContext(plan).testImages;
  return Array.isArray(images) ? (images as StudentPlanTestImage[]) : [];
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('lessons');
  const [students, setStudents] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [studentPlans, setStudentPlans] = useState<AdminStudentPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [savingStudentPlanId, setSavingStudentPlanId] = useState<string | null>(null);
  const [planDrafts, setPlanDrafts] = useState<Record<string, string>>({});

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
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterHtml, setNewsletterHtml] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [newsletterCampaigns, setNewsletterCampaigns] = useState<NewsletterCampaignSummary[]>([]);
  const [newsletterSubscribersCount, setNewsletterSubscribersCount] = useState(0);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      let activeUser = sessionData.session?.user ?? null;

      if (!activeUser) {
        const { data: userData } = await supabase.auth.getUser();
        activeUser = userData.user ?? null;
      }

      if (!activeUser) { router.push('/login'); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUser.id)
        .single();

      if (!prof?.is_admin) { router.push('/'); return; }

      setUser(activeUser);
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
      const { data: lessonsData, error: lessonsErr } = await supabase
        .from('lessons')
        .select('*, lesson_attachments(*)')
        .order('created_at', { ascending: false });
      console.log('Lessons fetch:', lessonsData?.length, lessonsErr);
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

  useEffect(() => {
    if (activeTab === 'plans') {
      void loadStudentPlans();
    }
  }, [activeTab]);

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
      let uploadedCount = 0;
      for (let i = 0; i < lessonFiles.length; i++) {
        const file = lessonFiles[i];
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${lesson.id}/${Date.now()}_${i}_${safeName}`;
        const { error: uploadErr } = await supabase.storage
          .from('lesson-files')
          .upload(filePath, file);

        if (uploadErr) {
          console.error(`Upload failed for ${file.name}:`, uploadErr.message);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('lesson-files')
          .getPublicUrl(filePath);

        const { error: attachErr } = await supabase.from('lesson_attachments').insert({
          lesson_id: lesson.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
        });

        if (attachErr) {
          console.error(`Attachment record failed for ${file.name}:`, attachErr.message);
        } else {
          uploadedCount++;
        }
      }

      showMessage(`Aula criada com sucesso! (${uploadedCount}/${lessonFiles.length} ficheiros)`, 'success');

      // Send notification email to student
      fetch('/api/send-lesson-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: lessonStudentId,
          title: lessonTitle,
          subject: lessonSubject,
          date: lessonDate,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            showMessage(
              payload?.error || 'A aula foi criada, mas houve falha no envio do email ao aluno.',
              'error',
            );
          }
        })
        .catch(() => {
          showMessage('A aula foi criada, mas não foi possível contactar o serviço de email.', 'error');
        });

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

  const refreshBookings = async () => {
    const { data: bks } = await supabase
      .from('bookings')
      .select('*, profiles(*)')
      .order('date', { ascending: false });
    setBookings(bks || []);
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

  const handleConfirmPayment = async (bookingId: string) => {
    const response = await fetch('/api/bookings/confirm-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    });
    const payload = await response.json();

    if (!response.ok) {
      showMessage(payload.error || 'Erro ao confirmar pagamento.', 'error');
      return;
    }

    await refreshBookings();

    if (payload.fully_confirmed) {
      showMessage('Pagamento confirmado e marcação atualizada com sucesso.', 'success');
      return;
    }

    showMessage('Pagamento registado. A marcação de grupo será confirmada quando todos pagarem.', 'success');
  };

  const handleCancelPedido = async (bookingId: string) => {
    if (!confirm('Tens a certeza que queres cancelar este pedido?')) return;
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      const bookingMeta = parseBookingMeta(booking.observations);
      // Release the slot
      const [startTime, endTime] = booking.time_slot.split('-');
      await supabase
        .from('available_slots')
        .update({ is_booked: false })
        .eq('date', booking.date)
        .eq('start_time', startTime)
        .eq('end_time', endTime);

      if (bookingMeta?.mode === 'group' && bookingMeta.groupId) {
        await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('date', booking.date)
          .eq('time_slot', booking.time_slot)
          .ilike('observations', `%group=${bookingMeta.groupId}%`);
        await refreshBookings();
        showMessage('Pedido de grupo cancelado e horário libertado.', 'success');
        return;
      }
    }
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    setBookings(bookings.map((b) =>
      b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
    ));
    showMessage('Pedido cancelado e horário libertado.', 'success');
  };

  const pendingPayments = bookings.filter(
    (b) => b.payment_method === 'in_person' && b.payment_status === 'pending_payment' && b.status !== 'cancelled'
  );

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
      for (let i = 0; i < editFiles.length; i++) {
        const file = editFiles[i];
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${lessonId}/${Date.now()}_${i}_${safeName}`;
        const { error: uploadErr } = await supabase.storage.from('lesson-files').upload(filePath, file);
        if (uploadErr) {
          console.error(`Upload failed for ${file.name}:`, uploadErr.message);
          continue;
        }
        const { data: urlData } = supabase.storage.from('lesson-files').getPublicUrl(filePath);
        await supabase.from('lesson_attachments').insert({
          lesson_id: lessonId,
          file_name: file.name,
          file_url: urlData.publicUrl,
        });
      }

      // Refresh lessons
      const { data: refreshed } = await supabase
        .from('lessons')
        .select('*, lesson_attachments(*)')
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

  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      throw new Error('Sessão expirada. Faz login novamente.');
    }
    return token;
  };

  const loadStudentPlans = async () => {
    setLoadingPlans(true);
    try {
      const { data, error } = await supabase
        .from('student_plans')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const plans = (data as AdminStudentPlan[] | null) || [];
      setStudentPlans(plans);
      setPlanDrafts((prev) => {
        const next = { ...prev };
        for (const plan of plans) {
          if (next[plan.id] === undefined) {
            next[plan.id] = plan.plan_text || '';
          }
        }
        return next;
      });
    } catch (err: any) {
      showMessage(err.message || 'Erro ao carregar os planos personalizados.', 'error');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSaveStudentPlan = async (studentPlan: AdminStudentPlan) => {
    const draft = (planDrafts[studentPlan.id] || '').trim();
    if (!draft) {
      showMessage('Escreve o plano antes de o disponibilizares ao aluno.', 'error');
      return;
    }

    setSavingStudentPlanId(studentPlan.id);
    try {
      const nextContext: StudentPlanContext = {
        ...getStudentPlanContext(studentPlan),
        requestStatus: 'ready',
        planReadyAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('student_plans')
        .update({
          plan_text: draft,
          ai_model: 'manual_por_alin',
          context_json: nextContext,
        })
        .eq('id', studentPlan.id)
        .select('*')
        .single();

      if (error) throw error;

      const updatedPlan = data as AdminStudentPlan;
      setStudentPlans((prev) => prev.map((item) => (item.id === updatedPlan.id ? updatedPlan : item)));
      setPlanDrafts((prev) => ({ ...prev, [updatedPlan.id]: updatedPlan.plan_text || '' }));
      showMessage('Plano personalizado guardado e disponibilizado ao aluno.', 'success');
    } catch (err: any) {
      showMessage(err.message || 'Erro ao guardar o plano personalizado.', 'error');
    } finally {
      setSavingStudentPlanId(null);
    }
  };

  const loadNewsletterData = async () => {
    setNewsletterLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/admin/newsletter/campaigns', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível carregar os dados da newsletter.');
      }

      setNewsletterCampaigns(payload.campaigns || []);
      setNewsletterSubscribersCount(payload.subscribersCount || 0);
    } catch (err: any) {
      showMessage(err.message || 'Erro ao carregar dados da newsletter.', 'error');
    } finally {
      setNewsletterLoading(false);
    }
  };

  const handleSendNewsletter = async () => {
    const subject = newsletterSubject.trim();
    const htmlContent = newsletterHtml.trim();
    if (!subject || !htmlContent) {
      showMessage('Preenche assunto e conteúdo da newsletter.', 'error');
      return;
    }

    setSendingNewsletter(true);
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, htmlContent }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Falha no envio da newsletter.');
      }

      showMessage(
        `Newsletter enviada: ${payload.sentCount}/${payload.recipientCount} com sucesso.`,
        payload.failedCount > 0 ? 'error' : 'success',
      );

      if (payload.failedCount === 0) {
        setNewsletterSubject('');
        setNewsletterHtml('');
      }

      await loadNewsletterData();
    } catch (err: any) {
      showMessage(err.message || 'Erro ao enviar newsletter.', 'error');
    } finally {
      setSendingNewsletter(false);
    }
  };

  const filteredAllLessons = allLessons
    .filter((lesson) => {
      if (aulasFilterDate && lesson.date !== aulasFilterDate) return false;
      if (aulasFilterSubject && lesson.subject !== aulasFilterSubject) return false;
      return true;
    });

  const personalizedPlans = [...studentPlans]
    .filter((plan) => {
      const questionnaire = getStudentPlanQuestionnaire(plan);
      return Boolean(
        questionnaire?.mainDifficulties ||
          questionnaire?.currentActions ||
          questionnaire?.goals ||
          plan.plan_text?.trim(),
      );
    })
    .sort((a, b) => {
      const statusDiff =
        (getStudentPlanStatus(a) === 'pending' ? 0 : 1) -
        (getStudentPlanStatus(b) === 'pending' ? 0 : 1);
      if (statusDiff !== 0) return statusDiff;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const getStudentLabel = (studentId: string) => {
    const student = students.find((item) => item.id === studentId);
    if (!student) return 'Aluno';
    return student.full_name || student.username || student.email || 'Aluno';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="animate-spin w-8 h-8 border-4 border-[#000000] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#f5f5f5]">
        <div className="relative bg-white border-b border-black/15 py-12 px-4 overflow-hidden">
          <MathRain />
          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#000000] mb-2">
              Administração
            </h1>
            <p className="text-gray-600">
              Gere aulas, marcações, horários e planos personalizados.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Messages */}
          {successMsg && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm animate-fade-in-up">
              <span className="inline-flex items-center gap-2">
                <BrandIcon token="✅" />
                <span>{successMsg}</span>
              </span>
            </div>
          )}
          {errorMsg && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-fade-in-up">
              <span className="inline-flex items-center gap-2">
                <BrandIcon token="❌" />
                <span>{errorMsg}</span>
              </span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap bg-white rounded-xl p-1 shadow-sm mb-8 gap-1">
              {[
                { key: 'lessons' as Tab, label: 'Criar aula', icon: '📚' },
                { key: 'aulas_manage' as Tab, label: 'Aulas', icon: '📖' },
                { key: 'pedidos' as Tab, label: 'Pedidos', icon: '💰' },
                { key: 'bookings' as Tab, label: 'Marcações', icon: '📅' },
                { key: 'slots' as Tab, label: 'Horários', icon: '🕐' },
                { key: 'plans' as Tab, label: 'Planos Personalizados', icon: '📝' },
                { key: 'newsletter' as Tab, label: 'Newsletter', icon: '📣' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (tab.key === 'newsletter') {
                      void loadNewsletterData();
                    }
                  }}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-[#000000] text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="inline-flex items-center gap-2 justify-center">
                  <BrandIcon token={tab.icon} />
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Create Lesson Tab */}
          {activeTab === 'lessons' && (
            <form onSubmit={handleCreateLesson} className="bg-white rounded-2xl shadow-md p-8 space-y-6 animate-fade-in-up">
              <h2 className="text-xl font-bold text-[#000000]">Criar nova aula</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Aluno *</label>
                  <select
                    value={lessonStudentId}
                    onChange={(e) => setLessonStudentId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none bg-[#f5f5f5] text-sm"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none bg-[#f5f5f5] text-sm"
                    required
                  >
                    <option value="">Seleciona a disciplina</option>
                    {ADMIN_LESSON_SUBJECTS.map((s) => (
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none bg-[#f5f5f5] text-sm"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none bg-[#f5f5f5] text-sm"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none bg-[#f5f5f5] text-sm resize-none"
                  placeholder="Sumário da aula, conteúdos abordados, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 inline-flex items-center gap-2">
                  <BrandIcon token="📎" />
                  <span>Anexos</span>
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] min-h-[56px]">
                  <label className="inline-block py-2 px-4 rounded-full text-sm font-semibold bg-[#000000]/10 text-[#000000] hover:bg-[#000000]/20 cursor-pointer transition-colors">
                    Escolher ficheiros
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const newFiles = Array.from(e.target.files || []);
                        setLessonFiles(prev => {
                          const combined = [...prev, ...newFiles];
                          return combined.slice(0, 10);
                        });
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {lessonFiles.length === 0 && (
                    <span className="ml-3 text-sm text-gray-400">Nenhum ficheiro selecionado</span>
                  )}
                  {lessonFiles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {lessonFiles.map((f, i) => (
                        <span key={i} className="text-xs bg-[#000000]/10 text-[#000000] px-3 py-1 rounded-full flex items-center gap-1">
                          {f.name}
                          <button type="button" onClick={() => setLessonFiles(prev => prev.filter((_, idx) => idx !== i))} className="ml-1 hover:text-red-500">&times;</button>
                        </span>
                      ))}
                      <span className="text-xs text-gray-400 self-center">{lessonFiles.length}/10</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingLesson}
                className="w-full py-4 bg-[#000000] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
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
                  <strong className="text-[#000000]">{filteredAllLessons.length}</strong>{' '}
                  {filteredAllLessons.length === 1 ? 'aula' : 'aulas'}
                </p>

                {/* Date filter */}
                <div className="relative">
                  <button
                    onClick={() => { setAulasShowDatePicker(!aulasShowDatePicker); setAulasShowSubjectPicker(false); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      aulasFilterDate
                        ? 'bg-[#111111] text-white shadow-sm'
                        : 'bg-white text-gray-500 hover:text-gray-700 shadow-sm'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Data
                    {aulasFilterDate && (
                      <span onClick={(e) => { e.stopPropagation(); setAulasFilterDate(''); setAulasShowDatePicker(false); }}
                        className="ml-1 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] hover:bg-white/50 cursor-pointer">&times;</span>
                    )}
                  </button>
                  {aulasShowDatePicker && (
                    <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-20 animate-fade-in-up">
                      <input type="date" value={aulasFilterDate}
                        onChange={(e) => { setAulasFilterDate(e.target.value); setAulasShowDatePicker(false); }}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none" />
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
                        ? 'bg-[#111111] text-white shadow-sm'
                        : 'bg-white text-gray-500 hover:text-gray-700 shadow-sm'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Disciplina
                    {aulasFilterSubject && (
                      <span onClick={(e) => { e.stopPropagation(); setAulasFilterSubject(''); setAulasShowSubjectPicker(false); }}
                        className="ml-1 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] hover:bg-white/50 cursor-pointer">&times;</span>
                    )}
                  </button>
                  {aulasShowSubjectPicker && (
                    <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 min-w-[180px] animate-fade-in-up">
                      {ADMIN_LESSON_SUBJECTS.map((s) => (
                        <button key={s}
                          onClick={() => { setAulasFilterSubject(s); setAulasShowSubjectPicker(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            aulasFilterSubject === s ? 'bg-[#000000]/10 text-[#000000] font-medium' : 'text-gray-700 hover:bg-[#f5f5f5]'
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
                          <h3 className="font-semibold text-[#000000] truncate">{lesson.title}</h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs bg-[#000000]/10 text-[#000000] px-2 py-0.5 rounded-full font-medium">{lesson.subject}</span>
                            <span className="text-xs text-gray-400">{formatDate(lesson.date)}</span>
                            <span className="text-xs text-gray-400">· {students.find(s => s.id === lesson.student_id)?.full_name || 'Aluno'}</span>
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
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] outline-none bg-[#f5f5f5] text-sm" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                <textarea value={editObservations} onChange={(e) => setEditObservations(e.target.value)} rows={3}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] outline-none bg-[#f5f5f5] text-sm resize-none" />
                              </div>

                              {/* Existing attachments */}
                              {lesson.lesson_attachments && lesson.lesson_attachments.length > 0 && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Anexos existentes</label>
                                  <div className="space-y-2">
                                    {lesson.lesson_attachments.map((att) => (
                                      <div key={att.id} className="flex items-center gap-3 bg-[#f5f5f5] rounded-xl p-3">
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
                                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-[#f5f5f5] min-h-[56px]">
                                  <label className="inline-block py-2 px-4 rounded-full text-sm font-semibold bg-[#000000]/10 text-[#000000] hover:bg-[#000000]/20 cursor-pointer transition-colors">
                                    Escolher ficheiros
                                    <input type="file" multiple className="hidden" onChange={(e) => {
                                      const newFiles = Array.from(e.target.files || []);
                                      setEditFiles(prev => {
                                        const combined = [...prev, ...newFiles];
                                        return combined.slice(0, 10);
                                      });
                                      e.target.value = '';
                                    }} />
                                  </label>
                                  {editFiles.length === 0 && (
                                    <span className="ml-3 text-sm text-gray-400">Nenhum ficheiro selecionado</span>
                                  )}
                                  {editFiles.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {editFiles.map((f, i) => (
                                        <span key={i} className="text-xs bg-[#000000]/10 text-[#000000] px-3 py-1 rounded-full flex items-center gap-1">
                                          {f.name}
                                          <button type="button" onClick={() => setEditFiles(prev => prev.filter((_, idx) => idx !== i))} className="ml-1 hover:text-red-500">&times;</button>
                                        </span>
                                      ))}
                                      <span className="text-xs text-gray-400 self-center">{editFiles.length}/10</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-3">
                                <button onClick={() => handleEditLesson(lesson.id)}
                                  className="px-6 py-2.5 bg-[#000000] text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm">
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
                                  <h4 className="text-sm font-semibold text-[#000000] mb-2 inline-flex items-center gap-2"><BrandIcon token="📝" /><span>Observações</span></h4>
                                  <p className="text-sm text-gray-600 bg-[#f5f5f5] rounded-xl p-4 leading-relaxed">{lesson.observations}</p>
                                </div>
                              )}

                              {lesson.lesson_attachments && lesson.lesson_attachments.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-[#000000] mb-2 inline-flex items-center gap-2"><BrandIcon token="📎" /><span>Anexos</span></h4>
                                  <div className="space-y-2">
                                    {lesson.lesson_attachments.map((att) =>
                                      isImageFile(att.file_name) ? (
                                        <button key={att.id}
                                          onClick={() => { setLightboxSrc(getAttachmentUrl(att)); setLightboxAlt(att.file_name); }}
                                          className="block w-full rounded-xl overflow-hidden bg-[#f5f5f5] hover:ring-2 hover:ring-[#000000]/40 transition-all cursor-zoom-in">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={getAttachmentUrl(att)} alt={att.file_name} className="w-full max-h-64 object-contain" />
                                        </button>
                                      ) : (
                                        <a key={att.id} href={getAttachmentUrl(att)} target="_blank" rel="noopener noreferrer"
                                          className="flex items-center gap-3 bg-[#f5f5f5] rounded-xl p-3 hover:bg-[#000000]/10 transition-colors group">
                                          <svg className="w-5 h-5 text-[#000000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                          <span className="text-sm text-gray-700 group-hover:text-[#000000] transition-colors truncate">{att.file_name}</span>
                                        </a>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-3 pt-2">
                                <button onClick={() => { setEditingLessonId(lesson.id); setEditTitle(lesson.title); setEditObservations(lesson.observations || ''); }}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-[#000000]/10 text-[#000000] font-medium rounded-xl hover:bg-[#000000]/20 transition-colors text-sm">
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

          {/* Pedidos Tab */}
          {activeTab === 'pedidos' && (
            <div className="space-y-4 animate-fade-in-up">
              <p className="text-sm text-gray-500 mb-4">
                Pedidos de pagamento presencial pendentes: <strong className="text-[#000000]">{pendingPayments.length}</strong>
              </p>
              {pendingPayments.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-400">Sem pedidos pendentes de pagamento.</p>
                </div>
              ) : (
                pendingPayments.map((booking) => {
                  const bookingMeta = parseBookingMeta(booking.observations);
                  const cleanObservations = stripBookingMeta(booking.observations);
                  return (
                  <div key={booking.id} className="bg-white rounded-2xl shadow-md p-5">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#000000]">
                          {booking.profiles?.full_name || booking.profiles?.username || 'Aluno'}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs bg-[#000000]/10 text-[#000000] px-2 py-0.5 rounded-full font-medium">
                            {booking.subject}
                          </span>
                          {bookingMeta?.mode === 'group' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1.5">
                              <BrandIcon token="👥" className="opacity-85" />
                              <span>Grupo ({bookingMeta.size})</span>
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{booking.date}</span>
                          <span className="text-xs text-gray-400">{booking.time_slot}</span>
                          <span className="text-xs text-gray-400">Preço: {formatEuroFromCents(booking.price)}</span>
                        </div>
                        {cleanObservations && (
                          <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">{cleanObservations}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium inline-flex items-center gap-1.5">
                            <BrandIcon token="💰" className="opacity-85" />
                            <span>Pagamento presencial pendente</span>
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(booking.created_at).toLocaleString('pt-PT')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfirmPayment(booking.id)}
                          className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <BrandIcon token="✅" className="opacity-90" />
                            <span>Confirmar pagamento</span>
                          </span>
                        </button>
                        <button
                          onClick={() => handleCancelPedido(booking.id)}
                          className="px-4 py-2.5 bg-red-50 text-red-500 font-semibold rounded-xl hover:bg-red-100 transition-all text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )})
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
                bookings.map((booking) => {
                  const bookingMeta = parseBookingMeta(booking.observations);
                  const cleanObservations = stripBookingMeta(booking.observations);
                  return (
                  <div key={booking.id} className="bg-white rounded-2xl shadow-md p-5">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="font-semibold text-[#000000]">
                          {booking.profiles?.full_name || booking.profiles?.username || 'Aluno'}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs bg-[#000000]/10 text-[#000000] px-2 py-0.5 rounded-full font-medium">
                            {booking.subject}
                          </span>
                          {bookingMeta?.mode === 'group' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1.5">
                              <BrandIcon token="👥" className="opacity-85" />
                              <span>Grupo ({bookingMeta.size})</span>
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{booking.date}</span>
                          <span className="text-xs text-gray-400">{booking.time_slot}</span>
                          <span className="text-xs text-gray-400">{formatEuroFromCents(booking.price)}</span>
                        </div>
                        {cleanObservations && (
                          <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">{cleanObservations}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          booking.status === 'confirmed' ? 'bg-gray-100 text-gray-700' :
                          booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {booking.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1.5">
                              <BrandIcon token="⏳" className="opacity-90" />
                              <span>Pendente</span>
                            </span>
                          ) : booking.status === 'confirmed' ? (
                            <span className="inline-flex items-center gap-1.5">
                              <BrandIcon token="✅" className="opacity-90" />
                              <span>Confirmada</span>
                            </span>
                          ) : booking.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1.5">
                              <BrandIcon token="🎉" className="opacity-90" />
                              <span>Concluída</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <BrandIcon token="❌" className="opacity-90" />
                              <span>Cancelada</span>
                            </span>
                          )}
                        </span>

                        <select
                          value={booking.status}
                          onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-[#000000]"
                        >
                          <option value="pending">Pendente</option>
                          <option value="confirmed">Confirmada</option>
                          <option value="completed">Concluída</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )})
              )}
            </div>
          )}

          {/* Slots Tab */}
          {activeTab === 'slots' && (
            <div className="space-y-8 animate-fade-in-up">
              {/* Bulk Slot Creation */}
              <div className="bg-white rounded-2xl shadow-md p-8">
                <h2 className="text-xl font-bold text-[#000000] mb-2">Disponibilidade em massa</h2>
                <p className="text-sm text-gray-500 mb-6">Seleciona um intervalo de datas, os dias da semana e os horários para gerar todos os slots de uma vez.</p>

                <div className="space-y-6">
                  {/* Date range */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 inline-flex items-center gap-2">
                        <BrandIcon token="📅" />
                        <span>Data de início</span>
                      </label>
                      <input
                        type="date"
                        value={bulkStartDate}
                        onChange={(e) => setBulkStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#000000] bg-[#f5f5f5] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 inline-flex items-center gap-2">
                        <BrandIcon token="📅" />
                        <span>Data de fim</span>
                      </label>
                      <input
                        type="date"
                        value={bulkEndDate}
                        onChange={(e) => setBulkEndDate(e.target.value)}
                        min={bulkStartDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#000000] bg-[#f5f5f5] text-sm"
                      />
                    </div>
                  </div>

                  {/* Days of week */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 inline-flex items-center gap-2">
                      <BrandIcon token="📆" />
                      <span>Dias da semana</span>
                    </label>
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
                                ? 'bg-[#000000] text-white shadow-md'
                                : 'bg-[#f5f5f5] text-gray-600 hover:bg-[#000000]/10'
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
                      <label className="block text-sm font-medium text-gray-700 inline-flex items-center gap-2">
                        <BrandIcon token="🕐" />
                        <span>Horários</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setBulkTimeSlots(prev => [...prev, { start: '', end: '' }])}
                        className="text-xs text-[#000000] hover:text-[#111111] font-medium flex items-center gap-1"
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
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#000000] bg-[#f5f5f5] text-sm"
                          />
                          <span className="text-gray-400 text-sm">→</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => setBulkTimeSlots(prev => prev.map((s, idx) => idx === i ? { ...s, end: e.target.value } : s))}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#000000] bg-[#f5f5f5] text-sm"
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
                    <div className="bg-[#000000]/10 border border-[#000000]/20 rounded-xl p-4 text-sm text-[#111111]">
                      <span className="inline-flex items-center gap-2">
                        <BrandIcon token="📊" />
                        <span>Vai criar <strong>{calculateBulkCount()}</strong> horários no total.</span>
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleBulkCreateSlots}
                    disabled={submittingSlot || !bulkStartDate || !bulkEndDate || bulkDays.length === 0 || !bulkTimeSlots.some(s => s.start && s.end)}
                    className="w-full py-4 bg-[#000000] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submittingSlot ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        A criar horários...
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-2">
                        <BrandIcon token="🚀" />
                        <span>Gerar horários disponíveis</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Single slot (quick add) */}
              <form onSubmit={handleCreateSlot} className="bg-white rounded-2xl shadow-md p-8">
                <h2 className="text-lg font-bold text-[#000000] mb-4">Adicionar horário individual</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Data</label>
                    <input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#000000] bg-[#f5f5f5] text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora início</label>
                    <input type="time" value={slotStartTime} onChange={(e) => setSlotStartTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#000000] bg-[#f5f5f5] text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora fim</label>
                    <input type="time" value={slotEndTime} onChange={(e) => setSlotEndTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#000000] bg-[#f5f5f5] text-sm" required />
                  </div>
                </div>
                <button type="submit" disabled={submittingSlot}
                  className="mt-4 px-8 py-3 bg-[#000000] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm">
                  {submittingSlot ? 'A adicionar...' : 'Adicionar horário'}
                </button>
              </form>

              {/* Existing slots */}
              <div>
                <h3 className="text-lg font-bold text-[#000000] mb-4">Horários futuros ({existingSlots.length})</h3>
                {existingSlots.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-md p-10 text-center">
                    <p className="text-gray-400">Sem horários futuros.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {existingSlots.map((slot) => (
                      <div key={slot.id} className={`bg-white rounded-xl shadow-sm p-4 flex items-center justify-between ${slot.is_booked ? 'opacity-50' : ''}`}>
                        <div>
                          <p className="text-sm font-semibold text-[#000000]">{slot.date}</p>
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

          {activeTab === 'plans' && (
            <div className="space-y-6 animate-fade-in-up">
              <section className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-[#000000]">Planos Personalizados</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Recebe os pedidos dos alunos, escreve o plano manualmente e disponibiliza-o quando estiver pronto.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadStudentPlans()}
                    className="text-sm text-[#000000] hover:text-[#111111] font-medium"
                  >
                    Atualizar
                  </button>
                </div>

                <div className="rounded-xl bg-[#fafafa] border border-[#000000]/20 px-4 py-3 text-sm text-[#111111]">
                  Pedidos registados: <strong>{personalizedPlans.length}</strong>
                </div>
              </section>

              {loadingPlans ? (
                <div className="bg-white rounded-2xl shadow-md p-10 text-center">
                  <p className="text-gray-400">A carregar planos personalizados...</p>
                </div>
              ) : personalizedPlans.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-10 text-center">
                  <p className="text-gray-400">Ainda não existem pedidos de planos personalizados.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {personalizedPlans.map((studentPlan) => {
                    const questionnaire = getStudentPlanQuestionnaire(studentPlan);
                    const testImages = getStudentPlanImages(studentPlan);
                    const status = getStudentPlanStatus(studentPlan);
                    const student = students.find((item) => item.id === studentPlan.student_id) || null;
                    const draftValue =
                      planDrafts[studentPlan.id] !== undefined
                        ? planDrafts[studentPlan.id]
                        : studentPlan.plan_text || '';

                    return (
                      <section key={studentPlan.id} className="bg-white rounded-2xl shadow-md p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                          <div>
                            <h3 className="text-lg font-bold text-[#000000]">
                              {getStudentLabel(studentPlan.student_id)}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {student?.email || 'Sem email disponível'}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-medium ${
                                status === 'ready'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {status === 'ready' ? 'Disponível para o aluno' : 'Pedido pendente'}
                            </span>
                            <span className="text-xs text-gray-400">
                              Atualizado em {new Date(studentPlan.updated_at).toLocaleDateString('pt-PT')}
                            </span>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-3 mb-5">
                          <div className="rounded-xl bg-[#fafafa] border border-gray-100 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                              Principais dificuldades
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {questionnaire?.mainDifficulties || 'Sem informação.'}
                            </p>
                          </div>
                          <div className="rounded-xl bg-[#fafafa] border border-gray-100 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                              O que já está a fazer
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {questionnaire?.currentActions || 'Sem informação.'}
                            </p>
                          </div>
                          <div className="rounded-xl bg-[#fafafa] border border-gray-100 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                              Objetivos
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {questionnaire?.goals || 'Sem informação.'}
                            </p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 mb-5">
                          <div className="rounded-xl bg-[#fafafa] border border-gray-100 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                              Tempo de estudo
                            </p>
                            <p className="text-sm text-gray-700">
                              {questionnaire?.studyTimeValue
                                ? `${questionnaire.studyTimeValue} hora${questionnaire.studyTimeValue > 1 ? 's' : ''} ${
                                    questionnaire.studyTimeUnit === 'day' ? 'por dia' : 'por semana'
                                  }`
                                : 'Sem informação.'}
                            </p>
                          </div>
                          <div className="rounded-xl bg-[#fafafa] border border-gray-100 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                              Testes enviados
                            </p>
                            <p className="text-sm text-gray-700">
                              {testImages.length > 0
                                ? `${testImages.length} imagem${testImages.length > 1 ? 'ens' : ''}`
                                : 'Sem imagens anexadas.'}
                            </p>
                          </div>
                        </div>

                        {testImages.length > 0 && (
                          <div className="mb-5">
                            <p className="text-sm font-medium text-gray-700 mb-2">Imagens dos testes</p>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {testImages.map((image) => (
                                <div
                                  key={image.id}
                                  className="rounded-xl border border-gray-100 bg-[#fafafa] p-3"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`data:${image.mimeType};base64,${image.base64Data}`}
                                    alt={image.fileName}
                                    className="w-full h-36 object-cover rounded-lg border border-gray-200"
                                  />
                                  <p className="text-xs text-gray-500 mt-2 truncate">{image.fileName}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Plano a disponibilizar ao aluno
                          </label>
                          <textarea
                            value={draftValue}
                            onChange={(e) =>
                              setPlanDrafts((prev) => ({ ...prev, [studentPlan.id]: e.target.value }))
                            }
                            rows={12}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none bg-[#f5f5f5] text-sm resize-y"
                            placeholder="Escreve aqui o plano personalizado para este aluno."
                          />
                        </div>

                        <div className="flex justify-end mt-4">
                          <button
                            type="button"
                            onClick={() => void handleSaveStudentPlan(studentPlan)}
                            disabled={savingStudentPlanId === studentPlan.id}
                            className="px-5 py-3 rounded-xl bg-[#000000] text-white text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-60"
                          >
                            {savingStudentPlanId === studentPlan.id
                              ? 'A guardar...'
                              : 'Guardar e disponibilizar'}
                          </button>
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Newsletter Tab */}
          {activeTab === 'newsletter' && (
            <div className="space-y-6 animate-fade-in-up">
              <section className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
                <h2 className="text-xl font-bold text-[#000000] mb-2">Enviar newsletter</h2>
                <p className="text-sm text-gray-500 mb-5">
                  Esta funcionalidade é interna (admin) e não aparece para utilizadores comuns.
                </p>

                <div className="rounded-xl bg-[#fafafa] border border-[#000000]/20 px-4 py-3 mb-5 text-sm text-[#111111]">
                  Subscritores ativos: <strong>{newsletterSubscribersCount}</strong>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Assunto</label>
                    <input
                      type="text"
                      value={newsletterSubject}
                      onChange={(e) => setNewsletterSubject(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none bg-[#f5f5f5] text-sm"
                      placeholder="Ex: Novidades da semana MatemáticaTop"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Conteúdo HTML</label>
                    <textarea
                      value={newsletterHtml}
                      onChange={(e) => setNewsletterHtml(e.target.value)}
                      rows={10}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none bg-[#f5f5f5] text-sm font-mono resize-y"
                      placeholder="<h1>Novidades</h1><p>Texto...</p>"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendNewsletter}
                    disabled={sendingNewsletter || newsletterSubscribersCount === 0}
                    className="w-full sm:w-auto px-6 py-3 bg-[#000000] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingNewsletter ? 'A enviar...' : 'Enviar newsletter'}
                  </button>
                </div>
              </section>

              <section className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#000000]">Campanhas recentes</h3>
                  <button
                    type="button"
                    onClick={() => void loadNewsletterData()}
                    className="text-sm text-[#000000] hover:text-[#111111] font-medium"
                  >
                    Atualizar
                  </button>
                </div>

                {newsletterLoading ? (
                  <p className="text-sm text-gray-500">A carregar campanhas...</p>
                ) : newsletterCampaigns.length === 0 ? (
                  <p className="text-sm text-gray-500">Sem campanhas enviadas.</p>
                ) : (
                  <div className="space-y-3">
                    {newsletterCampaigns.map((campaign) => (
                      <div key={campaign.id} className="rounded-xl border border-gray-100 bg-[#fafafa] px-4 py-3">
                        <p className="text-sm font-semibold text-[#000000]">{campaign.subject}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Estado: {campaign.status} · Enviados: {campaign.sent_count}/{campaign.recipient_count} ·
                          Falhas: {campaign.failed_count}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
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
