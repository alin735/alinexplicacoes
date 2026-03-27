'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import BrandIcon from '@/components/BrandIcon';

const contacts = [
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
    handle: 'Comunidade Alin',
    url: 'https://discord.gg/7eK2QAsp23',
    hoverBg: 'hover:bg-black/5',
    icon: <BrandIcon token="discord" size={34} />,
  },
];

export default function ContactoPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#f5f5f5]">
        <div className="relative bg-white border-b border-black/15 py-12 px-4 overflow-hidden">
          <MathRain />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#000000] mb-2">
              Contacto
            </h1>
            <p className="text-gray-600">
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

          {/* Direct contact */}
          <div className="mt-12 bg-gradient-to-br from-[#000000]/10 to-[#4a4a4a]/10 border border-[#000000]/20 rounded-2xl p-8 text-center animate-fade-in-up">
            <h3 className="text-xl font-bold text-[#000000] mb-2">
              Precisas de ajuda?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Entra em contacto comigo através de qualquer uma das plataformas acima.
            </p>
            <a
              href="/marcar"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#000000] text-white rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
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
