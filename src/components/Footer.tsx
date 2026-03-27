'use client';
import Image from 'next/image';
import BrandIcon from '@/components/BrandIcon';

export default function Footer() {
  return (
    <footer className="bg-white border-t-[3px] border-[#000000] py-10">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-white border border-black/25 overflow-hidden flex items-center justify-center">
            <Image src="/logo.png" alt="MatemáticaTop" width={36} height={36} className="object-cover" />
          </div>
          <span className="text-[#111111] font-bold text-xl">MatemáticaTop</span>
        </div>
        <div className="flex justify-center gap-5 mb-6">
          <a
            href="https://www.tiktok.com/@matematicatop1?is_from_webapp=1&sender_device=pc"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-white border border-black/30 flex items-center justify-center hover:bg-black/5 hover:-translate-y-1 hover:shadow-lg transition-all"
          >
            <BrandIcon token="tiktok" size={22} />
          </a>
          <a
            href="https://youtube.com/@matematicatop1?si=dH9qdhF7ur3Y9EhR"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-white border border-black/30 flex items-center justify-center hover:bg-black/5 hover:-translate-y-1 hover:shadow-lg transition-all"
          >
            <BrandIcon token="youtube" size={22} />
          </a>
          <a
            href="https://discord.gg/7eK2QAsp23"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-white border border-black/30 flex items-center justify-center hover:bg-black/5 hover:-translate-y-1 hover:shadow-lg transition-all"
          >
            <BrandIcon token="discord" size={22} />
          </a>
        </div>

        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} MatemáticaTop. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
