'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import BrandIcon from '@/components/BrandIcon';
import { whatsappLink, WHATSAPP_DISPLAY } from '@/lib/site';

const contacts = [
  {
    name: 'WhatsApp',
    handle: WHATSAPP_DISPLAY,
    url: whatsappLink(),
    hoverBg: 'hover:bg-[#25D366]/10',
    icon: (
      <svg className="h-[34px] w-[34px] text-[#25D366]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    handle: '@matematicatop1',
    url: 'https://www.tiktok.com/@matematicatop1?is_from_webapp=1&sender_device=pc',
    hoverBg: 'hover:bg-black/5',
    icon: <BrandIcon token="tiktok" size={34} />,
  },
  {
    name: 'YouTube',
    handle: '@matematicatop1',
    url: 'https://youtube.com/@matematicatop1?si=dH9qdhF7ur3Y9EhR',
    hoverBg: 'hover:bg-black/5',
    icon: <BrandIcon token="youtube" size={34} />,
  },
  {
    name: 'Discord',
    handle: 'Comunidade MatemáticaTop',
    url: 'https://discord.gg/7eK2QAsp23',
    hoverBg: 'hover:bg-black/5',
    icon: <BrandIcon token="discord" size={34} />,
  },
];

export default function ContactoPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
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
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível enviar a mensagem.');
      }

      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setFeedback('Mensagem enviada com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5]">
        <div className="relative overflow-hidden border-b border-black/15 bg-white px-4 pb-12 pt-32">
          <MathRain speed="fast" />
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-black text-[#000000] mb-2">
              Contacto
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Entra em contacto comigo ou acompanha a MatemáticaTop nas redes sociais.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-[#000000] mb-5">Enviar email</h2>

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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assunto</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20"
                  placeholder="Assunto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensagem</label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={6}
                  className="w-full rounded-2xl border border-black/10 bg-[#f7f9fc] px-4 py-3 text-sm outline-none transition-all focus:border-[#3f6c93] focus:ring-2 focus:ring-[#3f6c93]/20 resize-none"
                  placeholder="Escreve a tua mensagem"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1d2b38] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? 'A enviar...' : 'Enviar email'}
              </button>
            </form>

            {feedback && <p className="mt-4 text-sm text-emerald-700">{feedback}</p>}
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#000000] mb-5">Redes sociais</h2>
            <div className="space-y-4">
            {contacts.map((contact, i) => (
              <a
                key={i}
                href={contact.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-5 bg-white rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group animate-fade-in-up ${contact.hoverBg}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-[#eeeeee] border border-black/15 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                  {contact.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#000000] text-lg">{contact.name}</h3>
                  <p className="text-gray-500 text-sm">{contact.handle}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-[#000000] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
