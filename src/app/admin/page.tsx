'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase';
import type {
  Profile,
  ChatMessage,
  ChatThread,
  NewsletterSubscriberSummary,
} from '@/lib/types';
import MathRain from '@/components/MathRain';
import BrandIcon from '@/components/BrandIcon';

type Tab = 'messages' | 'newsletter';

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


function formatStudentLabel(student?: Pick<Profile, 'full_name' | 'username' | 'email'> | null) {
  if (!student) return 'Aluno';

  const name = (student.full_name || '').trim();
  const username = (student.username || '').trim();
  const email = (student.email || '').trim();
  const handle = username ? `@${username.replace(/^@/, '')}` : '';

  if (name && handle) return `${name} (${handle})`;
  if (name) return name;
  if (handle) return handle;
  if (email) return email;
  return 'Aluno';
}





export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('messages');
  const [students, setStudents] = useState<Profile[]>([]);


  // Bulk slot form

  // Slot form

  // Aulas management

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterHtml, setNewsletterHtml] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [sendingNewsletterTest, setSendingNewsletterTest] = useState(false);
  const [resendingCampaignId, setResendingCampaignId] = useState<string | null>(null);
  const [newsletterCampaigns, setNewsletterCampaigns] = useState<NewsletterCampaignSummary[]>([]);
  const [newsletterSubscribersCount, setNewsletterSubscribersCount] = useState(0);
  const [newsletterAccountSubscribersCount, setNewsletterAccountSubscribersCount] = useState(0);
  const [newsletterFooterSubscribersCount, setNewsletterFooterSubscribersCount] = useState(0);
  const [groupWaitlistSubscribersCount, setGroupWaitlistSubscribersCount] = useState(0);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriberSummary[]>([]);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [sendingGroupWaitlistEmail, setSendingGroupWaitlistEmail] = useState(false);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThreadMessages, setSelectedThreadMessages] = useState<ChatMessage[]>([]);
  const [loadingChatThreads, setLoadingChatThreads] = useState(false);
  const [loadingChatMessages, setLoadingChatMessages] = useState(false);
  const [chatReply, setChatReply] = useState('');
  const [sendingChatReply, setSendingChatReply] = useState(false);
  const [newChatStudentId, setNewChatStudentId] = useState('');
  const [startingChat, setStartingChat] = useState(false);
  const chatThreadSnapshotRef = useRef<Record<string, string>>({});
  const hasLoadedChatThreadsRef = useRef(false);

  const supabase = createClient();
  const router = useRouter();

  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      throw new Error('Sessão expirada. Faz login novamente.');
    }
    return token;
  };



  useEffect(() => {
    const init = async () => {
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

    };

    init()
      .catch(() => {
        setLoadError('Não foi possível carregar o painel. Recarrega a página.');
      })
      // Sem isto, qualquer falha deixava o painel eternamente a carregar.
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    void loadChatThreads();

    const interval = window.setInterval(() => {
      void loadChatThreads();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [user?.id, selectedThreadId]);

  useEffect(() => {
    if (activeTab !== 'messages' || !selectedThreadId) return;

    void loadThreadMessages(selectedThreadId, true);

    const interval = window.setInterval(() => {
      void loadThreadMessages(selectedThreadId, true);
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeTab, selectedThreadId]);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') { setSuccessMsg(msg); setErrorMsg(''); }
    else { setErrorMsg(msg); setSuccessMsg(''); }
    setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 4000);
  };

















  const isThreadUnreadForAdmin = (thread: ChatThread) => {
    if (!thread.last_message_at || thread.last_message_sender_role !== 'student') {
      return false;
    }

    if (!thread.admin_last_read_at) return true;

    return new Date(thread.last_message_at).getTime() > new Date(thread.admin_last_read_at).getTime();
  };

  const loadChatThreads = async () => {
    setLoadingChatThreads(true);
    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .select('*, profiles(*)')
        .order('last_message_at', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const nextThreads = (data as ChatThread[] | null) || [];

      if (hasLoadedChatThreadsRef.current) {
        const nextUnreadThread = nextThreads.find((thread) => {
          const previousTimestamp = chatThreadSnapshotRef.current[thread.id];
          return (
            thread.last_message_sender_role === 'student' &&
            Boolean(thread.last_message_at) &&
            thread.last_message_at !== previousTimestamp
          );
        });

        if (nextUnreadThread) {
          const studentName = formatStudentLabel(nextUnreadThread.profiles);
          showMessage(`Nova mensagem de ${studentName}.`, 'success');
        }
      }

      chatThreadSnapshotRef.current = Object.fromEntries(
        nextThreads.map((thread) => [thread.id, thread.last_message_at || '']),
      );
      hasLoadedChatThreadsRef.current = true;
      setChatThreads(nextThreads);

      if (nextThreads.length === 0) {
        setSelectedThreadId(null);
        setSelectedThreadMessages([]);
      } else if (!selectedThreadId) {
        setSelectedThreadId(nextThreads[0].id);
      }
    } catch (err: any) {
      showMessage(err.message || 'Erro ao carregar as mensagens.', 'error');
    } finally {
      setLoadingChatThreads(false);
    }
  };

  const loadThreadMessages = async (threadId: string, markAsRead: boolean) => {
    setLoadingChatMessages(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setSelectedThreadMessages((data as ChatMessage[] | null) || []);

      if (markAsRead) {
        const now = new Date().toISOString();
        const { data: updatedThread, error: updateError } = await supabase
          .from('chat_threads')
          .update({ admin_last_read_at: now })
          .eq('id', threadId)
          .select('*, profiles(*)')
          .single();

        if (!updateError && updatedThread) {
          const resolvedThread = updatedThread as ChatThread;
          setChatThreads((prev) =>
            prev.map((thread) => (thread.id === threadId ? resolvedThread : thread)),
          );
        }
      }
    } catch (err: any) {
      showMessage(err.message || 'Erro ao carregar a conversa.', 'error');
    } finally {
      setLoadingChatMessages(false);
    }
  };

  const handleSelectThread = async (threadId: string) => {
    setSelectedThreadId(threadId);
    await loadThreadMessages(threadId, true);
  };

  const handleSendChatReply = async () => {
    const messageText = chatReply.trim();
    if (!selectedThreadId || !user?.id || !messageText) return;

    setSendingChatReply(true);
    try {
      const now = new Date().toISOString();

      const { data: createdMessage, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: selectedThreadId,
          sender_id: user.id,
          sender_role: 'admin',
          message_text: messageText,
        })
        .select('*')
        .single();

      if (messageError) throw messageError;

      const { data: updatedThread, error: threadError } = await supabase
        .from('chat_threads')
        .update({
          last_message_text: messageText,
          last_message_sender_role: 'admin',
          last_message_at: now,
          admin_last_read_at: now,
        })
        .eq('id', selectedThreadId)
        .select('*, profiles(*)')
        .single();

      if (threadError) throw threadError;

      const token = await getAccessToken();
      const emailResponse = await fetch('/api/admin/chat/notify-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: (updatedThread as ChatThread).student_id,
          messageText,
        }),
      });

      setChatReply('');
      setSelectedThreadMessages((prev) => [...prev, createdMessage as ChatMessage]);
      setChatThreads((prev) => {
        const remaining = prev.filter((thread) => thread.id !== selectedThreadId);
        return [updatedThread as ChatThread, ...remaining];
      });

      if (!emailResponse.ok) {
        const payload = await emailResponse.json().catch(() => null);
        showMessage(
          payload?.error || 'Resposta enviada, mas não foi possível enviar o email ao aluno.',
          'error',
        );
        return;
      }

      showMessage('Resposta enviada com sucesso.', 'success');
    } catch (err: any) {
      showMessage(err.message || 'Erro ao enviar a resposta.', 'error');
    } finally {
      setSendingChatReply(false);
    }
  };

  const handleStartChat = async () => {
    if (!newChatStudentId) {
      showMessage('Seleciona um aluno para iniciares a conversa.', 'error');
      return;
    }

    setStartingChat(true);
    try {
      const existingThread = chatThreads.find((thread) => thread.student_id === newChatStudentId);

      if (existingThread) {
        setSelectedThreadId(existingThread.id);
        await loadThreadMessages(existingThread.id, true);
        showMessage('Conversa aberta com sucesso.', 'success');
        return;
      }

      const { data, error } = await supabase
        .from('chat_threads')
        .insert({
          student_id: newChatStudentId,
          last_message_text: '',
        })
        .select('*, profiles(*)')
        .single();

      if (error) throw error;

      const createdThread = data as ChatThread;
      setChatThreads((prev) => [createdThread, ...prev]);
      setSelectedThreadId(createdThread.id);
      setSelectedThreadMessages([]);
      setNewChatStudentId('');
      showMessage('Conversa iniciada com sucesso.', 'success');
    } catch (err: any) {
      showMessage(err.message || 'Erro ao iniciar a conversa.', 'error');
    } finally {
      setStartingChat(false);
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
      setNewsletterAccountSubscribersCount(payload.accountSubscribersCount || 0);
      setNewsletterFooterSubscribersCount(payload.footerSubscribersCount || 0);
      setGroupWaitlistSubscribersCount(payload.groupWaitlistSubscribersCount || 0);
      setNewsletterSubscribers(payload.subscribers || []);
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

  const handleSendGroupWaitlistEmail = async () => {
    const subject = newsletterSubject.trim();
    const htmlContent = newsletterHtml.trim();
    if (!subject || !htmlContent) {
      showMessage('Preenche assunto e conteúdo da newsletter.', 'error');
      return;
    }

    setSendingGroupWaitlistEmail(true);
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/admin/group-classes/waitlist/send-opening', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, htmlContent }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Falha no envio para a lista de espera.');
      }

      showMessage(
        `Lista de espera notificada: ${payload.sentCount}/${payload.recipientCount} enviados.`,
        payload.failedCount > 0 ? 'error' : 'success',
      );

      if (payload.failedCount === 0) {
        setNewsletterSubject('');
        setNewsletterHtml('');
      }

      await loadNewsletterData();
    } catch (err: any) {
      showMessage(err.message || 'Erro ao notificar lista de espera.', 'error');
    } finally {
      setSendingGroupWaitlistEmail(false);
    }
  };

  const handleSendNewsletterTest = async () => {
    const subject = newsletterSubject.trim();
    const htmlContent = newsletterHtml.trim();
    if (!subject || !htmlContent) {
      showMessage('Preenche assunto e conteúdo da newsletter.', 'error');
      return;
    }

    setSendingNewsletterTest(true);
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/admin/newsletter/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, htmlContent }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Falha no envio do teste de newsletter.');
      }

      showMessage(`Teste enviado para ${payload.email}.`, 'success');
    } catch (err: any) {
      showMessage(err.message || 'Erro ao enviar teste de newsletter.', 'error');
    } finally {
      setSendingNewsletterTest(false);
    }
  };

  const handleResendFailedNewsletter = async (campaignId: string) => {
    setResendingCampaignId(campaignId);
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/admin/newsletter/resend-failed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ campaignId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Falha no reenvio dos falhados.');
      }

      showMessage(
        `Reenvio concluído: ${payload.sentCount}/${payload.recipientCount} enviados.`,
        payload.failedCount > 0 ? 'error' : 'success',
      );
      await loadNewsletterData();
    } catch (err: any) {
      showMessage(err.message || 'Erro ao reenviar falhados.', 'error');
    } finally {
      setResendingCampaignId(null);
    }
  };



  const selectedThread = chatThreads.find((thread) => thread.id === selectedThreadId) || null;
  const unreadThreadsCount = chatThreads.filter(isThreadUnreadForAdmin).length;
  const chatEligibleStudents = students.filter((student) => !student.is_admin);

  const getStudentLabel = (studentId: string) => {
    const student = students.find((item) => item.id === studentId);
    return formatStudentLabel(student);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="animate-spin w-8 h-8 border-4 border-[#000000] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4">
        <div className="max-w-sm rounded-2xl border border-black/15 bg-white p-6 text-center">
          <p className="text-sm text-gray-700">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Recarregar
          </button>
        </div>
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
              Responde às mensagens dos alunos e trata dos envios da newsletter.
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
                { key: 'messages' as Tab, label: 'Mensagens', icon: '📋' },
                { key: 'newsletter' as Tab, label: 'Newsletter', icon: '📣' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (tab.key === 'newsletter') {
                      void loadNewsletterData();
                    }
                    if (tab.key === 'messages') {
                      void loadChatThreads();
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
                  {tab.key === 'messages' && unreadThreadsCount > 0 && (
                    <span
                      className={`inline-flex min-w-[1.35rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                        activeTab === tab.key ? 'bg-white text-[#000000]' : 'bg-[#000000] text-white'
                      }`}
                    >
                      {unreadThreadsCount}
                    </span>
                  )}
                </span>
              </button>
            ))}
            <Link
              href="/admin/lista-espera"
              className="flex-1 rounded-lg px-4 py-3 text-center text-sm font-medium text-gray-500 transition-all hover:text-gray-700"
            >
              <span className="inline-flex items-center gap-2 justify-center">
                <BrandIcon token="📋" />
                <span>Lista de espera</span>
              </span>
            </Link>
            <Link
              href="/admin/matematica-a"
              className="flex-1 rounded-lg px-4 py-3 text-center text-sm font-medium text-gray-500 transition-all hover:text-gray-700"
            >
              <span className="inline-flex items-center gap-2 justify-center">
                <BrandIcon token="📐" />
                <span>Matemática A</span>
              </span>
            </Link>
          </div>

          {activeTab === 'messages' && (
            <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] animate-fade-in-up">
              <section className="rounded-2xl border border-black/15 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-[#000000]">Mensagens</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Conversas recebidas através do chat do site.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadChatThreads()}
                    className="text-sm font-medium text-[#000000] hover:text-[#111111]"
                  >
                    Atualizar
                  </button>
                </div>

                <div className="mb-5 rounded-2xl border border-black/15 bg-[#f8f8f8] p-4">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Iniciar conversa com um aluno
                  </label>
                  <select
                    value={newChatStudentId}
                    onChange={(e) => setNewChatStudentId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#000000]"
                  >
                    <option value="">Seleciona um aluno</option>
                    {chatEligibleStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {formatStudentLabel(student)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void handleStartChat()}
                    disabled={startingChat || !newChatStudentId}
                    className="mt-3 w-full rounded-xl bg-[#000000] px-4 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {startingChat ? 'A iniciar...' : 'Iniciar conversa'}
                  </button>
                </div>

                {loadingChatThreads ? (
                  <p className="text-sm text-gray-500">A carregar conversas...</p>
                ) : chatThreads.length === 0 ? (
                  <p className="text-sm text-gray-500">Ainda não existem conversas.</p>
                ) : (
                  <div className="space-y-3">
                    {chatThreads.map((thread) => {
                      const studentName = formatStudentLabel(thread.profiles);
                      const isUnread = isThreadUnreadForAdmin(thread);

                      return (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => void handleSelectThread(thread.id)}
                          className={`w-full rounded-2xl border p-4 text-left transition-all ${
                            selectedThreadId === thread.id
                              ? 'border-[#000000] bg-[#f8f8f8]'
                              : 'border-black/15 bg-white hover:border-black/25'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#000000]">
                                {studentName}
                              </p>
                              <p className="mt-1 truncate text-xs text-gray-500">
                                {thread.last_message_text || 'Sem mensagens ainda.'}
                              </p>
                            </div>
                            {isUnread && (
                              <span className="mt-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                            )}
                          </div>
                          <p className="mt-2 text-xs text-gray-400">
                            {thread.last_message_at
                              ? new Date(thread.last_message_at).toLocaleString('pt-PT')
                              : 'Sem atividade'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-black/15 bg-white p-6 shadow-sm">
                {!selectedThread ? (
                  <div className="flex h-full min-h-[28rem] items-center justify-center text-center">
                    <p className="max-w-sm text-sm text-gray-500">
                      Seleciona uma conversa para veres as mensagens e responderes ao aluno.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-5 border-b border-black/15 pb-4">
                      <h3 className="text-lg font-bold text-[#000000]">
                        {formatStudentLabel(selectedThread.profiles)}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {selectedThread.profiles?.email || 'Sem email disponível'}
                      </p>
                    </div>

                    <div className="h-[26rem] overflow-y-auto rounded-2xl border border-black/15 bg-[#f8f8f8] p-4">
                      {loadingChatMessages ? (
                        <p className="text-sm text-gray-500">A carregar mensagens...</p>
                      ) : selectedThreadMessages.length === 0 ? (
                        <p className="text-sm text-gray-500">Esta conversa ainda não tem mensagens.</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedThreadMessages.map((message) => {
                            const isAdminMessage = message.sender_role === 'admin';

                            return (
                              <div
                                key={message.id}
                                className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                    isAdminMessage
                                      ? 'bg-[#000000] text-white'
                                      : 'border border-black/15 bg-white text-[#111111]'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap leading-relaxed">
                                    {message.message_text}
                                  </p>
                                  <p
                                    className={`mt-2 text-[11px] ${
                                      isAdminMessage ? 'text-white/70' : 'text-gray-400'
                                    }`}
                                  >
                                    {new Date(message.created_at).toLocaleString('pt-PT')}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mt-5">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Responder ao aluno
                      </label>
                      <textarea
                        value={chatReply}
                        onChange={(e) => setChatReply(e.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-2xl border border-gray-200 bg-[#f5f5f5] px-4 py-3 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#000000]"
                        placeholder="Escreve aqui a tua resposta."
                      />
                      <button
                        type="button"
                        onClick={() => void handleSendChatReply()}
                        disabled={sendingChatReply || !chatReply.trim()}
                        className="mt-4 rounded-xl bg-[#000000] px-5 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sendingChatReply ? 'A enviar...' : 'Enviar resposta'}
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>
          )}

          {/* Newsletter Tab */}
          {activeTab === 'newsletter' && (
            <div className="space-y-6 animate-fade-in-up">
              <section className="bg-white rounded-2xl border border-black/15 shadow-sm p-6 sm:p-8">
                <h2 className="text-xl font-bold text-[#000000] mb-2">Enviar newsletter</h2>
                <p className="text-sm text-gray-500 mb-5">
                  Esta funcionalidade é interna (admin) e não aparece para utilizadores comuns.
                </p>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-5">
                  <div className="rounded-xl bg-[#fafafa] border border-black/15 px-4 py-3 text-sm text-[#111111]">
                    Subscritores ativos: <strong>{newsletterSubscribersCount}</strong>
                  </div>
                  <div className="rounded-xl bg-[#fafafa] border border-black/15 px-4 py-3 text-sm text-[#111111]">
                    Contas do site: <strong>{newsletterAccountSubscribersCount}</strong>
                  </div>
                  <div className="rounded-xl bg-[#fafafa] border border-black/15 px-4 py-3 text-sm text-[#111111]">
                    Subscrições pelo footer: <strong>{newsletterFooterSubscribersCount}</strong>
                  </div>
                  <div className="rounded-xl bg-[#fafafa] border border-black/15 px-4 py-3 text-sm text-[#111111]">
                    Lista de espera (grupo): <strong>{groupWaitlistSubscribersCount}</strong>
                  </div>
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

                  <section className="rounded-xl border border-dashed border-black/25 bg-[#fafafa] px-4 py-4">
                    <h3 className="text-sm font-semibold text-[#000000]">Teste</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Envia um teste apenas para <strong>alincmat29@gmail.com</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={handleSendNewsletterTest}
                      disabled={sendingNewsletterTest}
                      className="mt-3 w-full sm:w-auto px-5 py-2.5 border border-[#000000] text-[#000000] font-semibold rounded-xl hover:bg-[#000000]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingNewsletterTest ? 'A enviar teste...' : 'Enviar teste'}
                    </button>
                  </section>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSendNewsletter}
                      disabled={sendingNewsletter || newsletterSubscribersCount === 0}
                      className="w-full sm:w-auto px-6 py-3 bg-[#000000] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingNewsletter ? 'A enviar...' : 'Enviar newsletter'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendGroupWaitlistEmail}
                      disabled={sendingGroupWaitlistEmail || groupWaitlistSubscribersCount === 0}
                      className="w-full sm:w-auto px-6 py-3 border border-[#000000] text-[#000000] font-semibold rounded-xl hover:bg-[#000000]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingGroupWaitlistEmail
                        ? 'A enviar para lista de espera...'
                        : 'Enviar para lista de espera (grupo)'}
                    </button>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-black/15 shadow-sm p-6 sm:p-8">
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
                        <button
                          type="button"
                          onClick={() => void handleResendFailedNewsletter(campaign.id)}
                          disabled={campaign.failed_count === 0 || resendingCampaignId === campaign.id}
                          className="mt-3 rounded-lg border border-[#000000] px-3 py-1.5 text-xs font-semibold text-[#000000] transition-all hover:bg-[#000000]/5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {resendingCampaignId === campaign.id ? 'A reenviar...' : 'Reenviar falhados'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-white rounded-2xl border border-black/15 shadow-sm p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#000000]">Subscritores</h3>
                  <button
                    type="button"
                    onClick={() => void loadNewsletterData()}
                    className="text-sm text-[#000000] hover:text-[#111111] font-medium"
                  >
                    Atualizar
                  </button>
                </div>

                {newsletterLoading ? (
                  <p className="text-sm text-gray-500">A carregar subscritores...</p>
                ) : newsletterSubscribers.length === 0 ? (
                  <p className="text-sm text-gray-500">Sem subscritores disponíveis.</p>
                ) : (
                  <div className="space-y-3">
                    {newsletterSubscribers.map((subscriber) => (
                      <div key={`${subscriber.source}-${subscriber.email}`} className="rounded-xl border border-gray-100 bg-[#fafafa] px-4 py-3">
                        <p className="text-sm font-semibold text-[#000000]">{subscriber.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {subscriber.email} · {subscriber.source === 'account' ? 'Conta do site' : 'Footer'}
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

    </>
  );
}
