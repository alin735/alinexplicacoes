'use client';

import { useRef, useState } from 'react';
import WaitlistModal from './WaitlistModal';
import { hasJoinedWaitlist } from './waitlist-utils';

const ENUNCIADO_PDF = '/exames/enunciado-prova-matematica-9-ano-2026.pdf';
const CORRECAO_VIDEO_EMBED = 'https://www.youtube.com/embed/UqBaYSoR3RE';
const CORRECAO_VIDEO_WATCH = 'https://youtu.be/UqBaYSoR3RE';

type Doc = 'enunciado' | 'correcao';

export default function CorrecaoClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [activeDoc, setActiveDoc] = useState<Doc>('correcao');

  const docsRef = useRef<HTMLDivElement | null>(null);

  const revealDocs = () => {
    setRevealed(true);
    setModalOpen(false);
    // Faz scroll suave para os documentos.
    setTimeout(() => {
      docsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleOpen = () => {
    // Se a pessoa já entrou na lista de espera (neste dispositivo), não voltamos
    // a pedir a inscrição: segue direto para o enunciado e a correção.
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
            <span aria-hidden>✓</span> Correção em vídeo, reconstruída pela comunidade
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl font-black text-[#000000]">
            Vê o enunciado e a correção do exame
          </h2>
          <p className="mt-2 text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
            Reconstruímos o Exame Nacional de Matemática do 9.º ano de 2026 com a ajuda da comunidade.
            Clica em baixo para abrires o enunciado e a correção em vídeo, questão a questão.
          </p>
          <button
            type="button"
            onClick={handleOpen}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#000000] px-9 py-4 text-lg font-black text-white shadow-lg shadow-black/25 transition hover:bg-[#1a1a1a] hover:scale-[1.02]"
          >
            Abrir enunciado e correção →
          </button>
        </div>
      )}

      {/* Documentos revelados */}
      {revealed && (
        <div ref={docsRef} className="scroll-mt-24">
          <div className="mb-4 inline-flex rounded-xl border border-black/15 bg-white p-1">
            <button
              type="button"
              onClick={() => setActiveDoc('correcao')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeDoc === 'correcao' ? 'bg-[#000000] text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              Correção em vídeo
            </button>
            <button
              type="button"
              onClick={() => setActiveDoc('enunciado')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeDoc === 'enunciado' ? 'bg-[#000000] text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              Enunciado
            </button>
          </div>

          <div className="rounded-2xl border border-black/15 bg-white p-3 sm:p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-black text-[#000000]">
                {activeDoc === 'enunciado' ? 'Enunciado do exame' : 'Correção do exame em vídeo'}
              </h3>
              {activeDoc === 'enunciado' ? (
                <a
                  href={ENUNCIADO_PDF}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-black transition hover:bg-black/5"
                >
                  ⬇ Descarregar PDF
                </a>
              ) : (
                <a
                  href={CORRECAO_VIDEO_WATCH}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-black transition hover:bg-black/5"
                >
                  ▶ Abrir no YouTube
                </a>
              )}
            </div>

            {activeDoc === 'enunciado' ? (
              <object data={ENUNCIADO_PDF} type="application/pdf" className="h-[80vh] w-full rounded-lg">
                <div className="flex flex-col items-center gap-3 p-8 text-center text-gray-600">
                  <p>O teu navegador não consegue mostrar o PDF aqui.</p>
                  <a href={ENUNCIADO_PDF} className="rounded-lg bg-[#000000] px-4 py-2 font-semibold text-white">
                    Abrir o PDF numa nova página
                  </a>
                </div>
              </object>
            ) : (
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                <iframe
                  src={CORRECAO_VIDEO_EMBED}
                  title="Correção do Exame Nacional de Matemática do 9.º ano 2026 em vídeo"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            )}
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
