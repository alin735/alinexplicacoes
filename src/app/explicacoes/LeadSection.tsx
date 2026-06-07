'use client';

import { useState } from 'react';
import { whatsappLink, WHATSAPP_DEFAULT_MESSAGE } from '@/lib/site';

export default function LeadSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setFeedback('');
    setError('');

    try {
      const response = await fetch('/api/explicacoes-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível enviar o pedido.');
      }

      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setFeedback('Pedido enviado. Vou entrar em contacto contigo em breve.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o pedido.');
    } finally {
      setSending(false);
    }
  };

  const openSiteChat = () => {
    window.dispatchEvent(new Event('open-site-chat'));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
        <h2 className="text-2xl font-bold text-[#000000] mb-2">Diz-me o que precisas</h2>
        <p className="text-gray-600 mb-4 max-w-2xl">
          Deixa o teu contacto e uma mensagem com o que queres trabalhar (ano, matéria, objetivo).
          Eu respondo, esclareço preços e horários, e ajudo-te a escolher o explicador certo para ti.
        </p>
        <p className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[#16a34a]/30 bg-[#f0fdf4] px-3.5 py-1.5 text-xs font-semibold text-[#15803d]">
          <span aria-hidden>✓</span>
          Enviar este pedido é gratuito e não te compromete a nada
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
                placeholder="O teu nome"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
                placeholder="O teu email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telemóvel</label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
              placeholder="O teu telemóvel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensagem</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20 resize-none"
              placeholder="Em que precisas de ajuda? (ano, matéria, objetivo)"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1d2b38] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? 'A enviar...' : 'Enviar pedido'}
          </button>
        </form>

        {feedback && <p className="mt-4 text-sm text-emerald-700">{feedback}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
        <h2 className="text-2xl font-bold text-[#000000] mb-2">Preferes falar já?</h2>
        <p className="text-gray-600 mb-5 max-w-2xl">
          Fala comigo diretamente no WhatsApp e respondo-te o mais rápido possível: esclareço preços,
          horários e ajudo-te a escolher o explicador certo.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={whatsappLink(WHATSAPP_DEFAULT_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-all hover:brightness-95"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
            </svg>
            Falar no WhatsApp
          </a>
          <button
            type="button"
            onClick={openSiteChat}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-black/60 bg-white px-5 py-3 text-sm font-semibold text-[#111111] transition-all hover:bg-black/5 hover:border-black"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.9A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Falar pelo chat do site
          </button>
        </div>
      </section>
    </div>
  );
}
