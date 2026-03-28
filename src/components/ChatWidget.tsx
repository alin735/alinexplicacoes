'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import type { ChatMessage, ChatThread } from '@/lib/types';

function isMissingSessionError(message: string | undefined) {
  return typeof message === 'string' && message.toLowerCase().includes('auth session missing');
}

function isUnreadForStudent(thread: ChatThread | null) {
  if (!thread?.last_message_at || thread.last_message_sender_role !== 'admin') {
    return false;
  }

  if (!thread.student_last_read_at) return true;

  return (
    new Date(thread.last_message_at).getTime() >
    new Date(thread.student_last_read_at).getTime()
  );
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatWidget() {
  const pathname = usePathname();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [hasPrompted, setHasPrompted] = useState(false);

  const shouldHide =
    pathname?.startsWith('/admin') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';
  const loginHref = pathname ? `/login?next=${encodeURIComponent(pathname)}` : '/login';
  const unread = isUnreadForStudent(thread);

  useEffect(() => {
    if (messages.length === 0) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (shouldHide) return;

    let mounted = true;

    const loadCurrentUser = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError && !isMissingSessionError(sessionError.message)) {
        if (mounted) setError('Não foi possível abrir o chat agora.');
        return;
      }

      let activeUser = sessionData.session?.user ?? null;
      if (!activeUser) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError && !isMissingSessionError(userError.message)) {
          if (mounted) setError('Não foi possível abrir o chat agora.');
          return;
        }
        activeUser = userData.user ?? null;
      }

      if (!mounted) return;
      setUser(activeUser);
      setError('');
    };

    void loadCurrentUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          setThread(null);
          setMessages([]);
        }
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [shouldHide, supabase]);

  useEffect(() => {
    if (shouldHide || !user?.id) return;

    let cancelled = false;

    const loadConversation = async (markAsRead: boolean) => {
      setLoading(true);

      const { data: threadData, error: threadError } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle();

      if (threadError) {
        if (!cancelled) {
          setError('Não foi possível carregar o chat.');
          setLoading(false);
        }
        return;
      }

      const nextThread = (threadData as ChatThread | null) || null;

      if (!nextThread) {
        if (!cancelled) {
          setThread(null);
          setMessages([]);
          setLoading(false);
          setError('');
        }
        return;
      }

      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', nextThread.id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        if (!cancelled) {
          setError('Não foi possível carregar as mensagens.');
          setLoading(false);
        }
        return;
      }

      let resolvedThread = nextThread;
      if (markAsRead && isUnreadForStudent(nextThread)) {
        const now = new Date().toISOString();
        const { data: updatedThread, error: updateError } = await supabase
          .from('chat_threads')
          .update({ student_last_read_at: now })
          .eq('id', nextThread.id)
          .select('*')
          .single();

        if (!updateError && updatedThread) {
          resolvedThread = updatedThread as ChatThread;
        }
      }

      if (!cancelled) {
        setThread(resolvedThread);
        setMessages((messagesData as ChatMessage[] | null) || []);
        setLoading(false);
        setError('');
      }
    };

    void loadConversation(isOpen);

    const interval = window.setInterval(() => {
      void loadConversation(isOpen);
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isOpen, shouldHide, supabase, user?.id]);

  if (shouldHide) {
    return null;
  }

  const handleOpen = () => {
    setIsOpen(true);
    setHasPrompted(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsExpanded(false);
    setHasPrompted(true);
  };

  const handleSend = async () => {
    if (!user?.id) {
      setIsOpen(true);
      return;
    }

    const messageText = draft.trim();
    if (!messageText) return;

    setSending(true);
    setError('');

    try {
      let activeThread = thread;

      if (!activeThread) {
        const { data: createdThread, error: createThreadError } = await supabase
          .from('chat_threads')
          .insert({
            student_id: user.id,
            last_message_text: '',
            student_last_read_at: new Date().toISOString(),
          })
          .select('*')
          .single();

        if (createThreadError) throw createThreadError;
        activeThread = createdThread as ChatThread;
      }

      const now = new Date().toISOString();
      const { data: createdMessage, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: activeThread.id,
          sender_id: user.id,
          sender_role: 'student',
          message_text: messageText,
        })
        .select('*')
        .single();

      if (messageError) throw messageError;

      const { data: updatedThread, error: updateThreadError } = await supabase
        .from('chat_threads')
        .update({
          last_message_text: messageText,
          last_message_sender_role: 'student',
          last_message_at: now,
          student_last_read_at: now,
        })
        .eq('id', activeThread.id)
        .select('*')
        .single();

      if (updateThreadError) throw updateThreadError;

      setThread(updatedThread as ChatThread);
      setMessages((prev) => [...prev, createdMessage as ChatMessage]);
      setDraft('');
      setIsOpen(true);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  };

  const renderChatPanel = (expanded: boolean) => (
    <div
      className={
        expanded
          ? 'relative flex h-full w-full max-w-5xl max-h-[56rem] flex-col rounded-[32px] border border-[#000000]/15 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-6'
          : 'fixed bottom-24 left-4 z-[70] w-[calc(100vw-2rem)] max-w-[23rem] rounded-[28px] border border-[#000000]/15 bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] sm:left-6'
      }
    >
      <div className="mb-4 h-1.5 w-14 rounded-full bg-[#000000]/8" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[1.35rem] font-bold leading-none text-[#000000]">Chat</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:text-gray-600"
            aria-label={expanded ? 'Fechar janela expandida' : 'Abrir chat em janela expandida'}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 3h6v6M21 3l-7 7M9 21H3v-6M3 21l7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Fechar chat"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {!user ? (
        <div className="mt-5 rounded-3xl border border-[#000000]/10 bg-[#f8f8f8] p-4">
          <p className="text-sm leading-relaxed text-gray-700">
            Começa por fazer login para falares com o Alin.
          </p>
          <Link
            href={loginHref}
            className="mt-4 inline-flex items-center rounded-2xl bg-[#000000] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg"
          >
            Login
          </Link>
        </div>
      ) : (
        <div className={expanded ? 'mt-5 flex min-h-0 flex-1 flex-col' : ''}>
          <div
            className={`overflow-y-auto rounded-3xl border border-[#000000]/10 bg-[#f8f8f8] p-3.5 ${
              expanded ? 'min-h-0 flex-1' : 'mt-5 h-64'
            }`}
          >
            {loading ? (
              <p className="text-sm text-gray-500">A carregar mensagens...</p>
            ) : messages.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-[#000000]/12 bg-white px-4 py-5">
                <p className="text-sm leading-relaxed text-gray-500">
                  Envia a tua primeira mensagem para começar a tua conversa com o Alin, onde podes esclarecer dúvidas sobre o funcionamento do site ou das explicações.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isOwn = message.sender_role === 'student';

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                          isOwn
                            ? 'bg-[#000000] text-white'
                            : 'border border-[#000000]/10 bg-white text-[#1a1a2e]'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{message.message_text}</p>
                        <p
                          className={`mt-1 text-[11px] ${
                            isOwn ? 'text-white/70' : 'text-gray-400'
                          }`}
                        >
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="mt-4 rounded-3xl border border-[#000000]/10 bg-[#f8f8f8] p-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={expanded ? 4 : 3}
              className="w-full resize-none rounded-[1.4rem] border border-[#000000]/10 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/10"
              placeholder="Escreve a tua mensagem..."
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || !draft.trim()}
                className="inline-flex items-center rounded-2xl bg-[#000000] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? 'A enviar...' : 'Enviar mensagem'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  );

  return (
    <>
      {isOpen && !isExpanded && renderChatPanel(false)}

      {isOpen && isExpanded && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="absolute inset-0 bg-black/20"
            aria-label="Fechar janela expandida"
          />
          {renderChatPanel(true)}
        </div>
      )}

      <button
        type="button"
        onClick={handleOpen}
        className={`fixed bottom-5 left-4 z-[65] flex h-14 w-14 items-center justify-center rounded-full bg-[#000000] text-white shadow-[0_16px_32px_rgba(0,0,0,0.25)] transition-transform hover:scale-[1.03] sm:left-6 ${
          isExpanded ? 'hidden' : ''
        }`}
        aria-label="Abrir chat"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h8M8 14h4m-8 6l1.7-3.4A8 8 0 014 4.8 8 8 0 0110.2 2h3.6A8.2 8.2 0 0122 10.2v.6A8.2 8.2 0 0113.8 19H7.6A8 8 0 014 18.2V20z"
          />
        </svg>
        {unread && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[11px] font-bold text-white">
            1
          </span>
        )}
      </button>
    </>
  );
}
