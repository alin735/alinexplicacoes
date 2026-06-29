'use client';

import { useRef, useState } from 'react';
import WaitlistModal from './WaitlistModal';
import { hasJoinedWaitlist } from './waitlist-utils';

type Props = {
  badge: string;
  heading: string;
  subtext: string;
  ctaLabel: string;
  revealedHeading: string;
  videoEmbed: string;
  videoWatch: string;
  videoTitle: string;
};

export default function CorrecaoClient({
  badge,
  heading,
  subtext,
  ctaLabel,
  revealedHeading,
  videoEmbed,
  videoWatch,
  videoTitle,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const docsRef = useRef<HTMLDivElement | null>(null);

  const revealDocs = () => {
    setRevealed(true);
    setModalOpen(false);
    // Faz scroll suave para a correção.
    setTimeout(() => {
      docsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleOpen = () => {
    // Se a pessoa já entrou na lista de espera (neste dispositivo), não voltamos
    // a pedir a inscrição: segue direto para a correção.
    if (hasJoinedWaitlist()) {
      revealDocs();
      return;
    }
    setModalOpen(true);
  };

  return (
    <div>
      {/* CTA principal */}
      {!revealed && (
        <div className="rounded-2xl border border-black/15 bg-white p-6 sm:p-8 text-center shadow-sm">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#16a34a]/30 bg-[#f0fdf4] px-3.5 py-1.5 text-xs font-semibold text-[#15803d]">
            <span aria-hidden>✓</span> {badge}
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl font-black text-[#000000]">{heading}</h2>
          <p className="mt-2 text-gray-600 max-w-xl mx-auto text-sm sm:text-base">{subtext}</p>
          <button
            type="button"
            onClick={handleOpen}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#000000] px-9 py-4 text-lg font-black text-white shadow-lg shadow-black/25 transition hover:bg-[#1a1a1a] hover:scale-[1.02]"
          >
            {ctaLabel}
          </button>
        </div>
      )}

      {/* Correção revelada */}
      {revealed && (
        <div ref={docsRef} className="scroll-mt-24">
          <div className="rounded-2xl border border-black/15 bg-white p-3 sm:p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-black text-[#000000]">{revealedHeading}</h3>
              <a
                href={videoWatch}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-black transition hover:bg-black/5"
              >
                ▶ Abrir no YouTube
              </a>
            </div>

            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              <iframe
                src={videoEmbed}
                title={videoTitle}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      <WaitlistModal
        open={modalOpen}
        mode="funnel"
        onClose={() => setModalOpen(false)}
        onJoined={revealDocs}
        onSkip={revealDocs}
      />
    </div>
  );
}
