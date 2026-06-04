'use client';

import { useState } from 'react';

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
        <p className="text-gray-600 mb-6 max-w-2xl">
          Deixa o teu contacto e uma mensagem com o que queres trabalhar (ano, matéria, objetivo).
          Eu respondo, esclareço preços e horários, e ajudo-te a escolher o explicador certo para ti.
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
          Usa o chat do site para falares comigo diretamente. Se ainda não tiveres conta, o chat pede
          um login rápido.
        </p>
        <button
          type="button"
          onClick={openSiteChat}
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-black/60 bg-white px-5 py-3 text-sm font-semibold text-[#111111] transition-all hover:bg-black/5 hover:border-black"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.9A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Falar pelo chat do site
        </button>
      </section>
    </div>
  );
}
