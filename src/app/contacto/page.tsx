'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';

const contacts = [
  {
    name: 'TikTok',
    handle: '@alinmat7',
    url: 'https://www.tiktok.com/@alinmat7?_r=1&_t=ZG-94HY3E4xdGy',
    color: 'from-gray-800 to-black',
    hoverBg: 'hover:bg-black/5',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48 6.3 6.3 0 001.86-4.49V8.74a8.18 8.18 0 004.72 1.5v-3.4a4.85 4.85 0 01-1-.15z"/>
      </svg>
    ),
  },
  {
    name: 'YouTube',
    handle: '@alinmat72',
    url: 'https://youtube.com/@alinmat72?si=dH9qdhF7ur3Y9EhR',
    color: 'from-red-500 to-red-700',
    hoverBg: 'hover:bg-red-50',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    name: 'Discord',
    handle: 'Comunidade Alin',
    url: 'https://discord.gg/7eK2QAsp23',
    color: 'from-indigo-500 to-indigo-700',
    hoverBg: 'hover:bg-indigo-50',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
      </svg>
    ),
  },
];

export default function ContactoPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#f0f4f8]">
        <div className="relative bg-gradient-to-r from-[#0d2f4a] to-[#1a5276] py-12 px-4 overflow-hidden">
          <MathRain />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Contacto
            </h1>
            <p className="text-white/60">
              Encontra-me nas redes sociais.
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-10">
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
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${contact.color} flex items-center justify-center text-white flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                  {contact.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#0d2f4a] text-lg">{contact.name}</h3>
                  <p className="text-gray-500 text-sm">{contact.handle}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-[#3498db] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>

          {/* Direct contact */}
          <div className="mt-12 bg-gradient-to-br from-[#3498db]/10 to-[#5dade2]/10 border border-[#3498db]/20 rounded-2xl p-8 text-center animate-fade-in-up">
            <h3 className="text-xl font-bold text-[#0d2f4a] mb-2">
              Precisas de ajuda?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Entra em contacto comigo através de qualquer uma das plataformas acima.
            </p>
            <a
              href="/marcar"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1a5276] to-[#2980b9] text-white rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Ou marca uma explicação
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
