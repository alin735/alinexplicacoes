'use client';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-[#0d2f4a] border-t-[3px] border-[#3498db] py-10">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-white overflow-hidden flex items-center justify-center">
            <Image src="/logo.png" alt="AlinMat" width={36} height={36} className="object-cover" />
          </div>
          <span className="text-white font-bold text-xl">AlinMat — Explicações com o Alin</span>
        </div>

        <div className="flex justify-center gap-5 mb-6">
          <a
            href="https://www.tiktok.com/@alinmat7?_r=1&_t=ZG-94HY3E4xdGy"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center hover:bg-[#3498db] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#3498db]/40 transition-all"
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48 6.3 6.3 0 001.86-4.49V8.74a8.18 8.18 0 004.72 1.5v-3.4a4.85 4.85 0 01-1-.15z"/>
            </svg>
          </a>
          <a
            href="https://youtube.com/@alinmat72?si=dH9qdhF7ur3Y9EhR"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center hover:bg-[#3498db] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#3498db]/40 transition-all"
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
          <a
            href="https://discord.gg/alinmat"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center hover:bg-[#3498db] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#3498db]/40 transition-all"
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
            </svg>
          </a>
        </div>

        <p className="text-white/50 text-sm">
          © {new Date().getFullYear()} Explicações com o Alin. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
