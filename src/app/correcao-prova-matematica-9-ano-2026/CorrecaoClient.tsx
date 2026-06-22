'use client';

import { useEffect, useRef, useState } from 'react';

const COURSES = [
  'Matemática',
  'Português',
  'Físico-Química',
  'Biologia-Geologia',
  'Filosofia',
  'Outra disciplina',
];

const ENUNCIADO_PDF = '/exames/enunciado-prova-matematica-9-ano-2026.pdf';
const CORRECAO_PDF = '/exames/correcao-prova-matematica-9-ano-2026.pdf';

type Doc = 'enunciado' | 'correcao';

export default function CorrecaoClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [activeDoc, setActiveDoc] = useState<Doc>('correcao');

  const [joinWaitlist, setJoinWaitlist] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState(COURSES[0]);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const docsRef = useRef<HTMLDivElement | null>(null);

  // Fecha o modal com Escape.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const revealDocs = () => {
    setRevealed(true);
    setModalOpen(false);
    // Faz scroll suave para os documentos.
    setTimeout(() => {
      docsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleContinue = async () => {
    setFeedback(null);

    // Se o aluno não quer entrar na lista, segue direto para o enunciado.
    if (!joinWaitlist) {
      revealDocs();
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFeedback({ type: 'error', text: 'Indica um email válido ou desativa a inscrição para continuar.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/exam-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim() || null,
          email: trimmedEmail,
          phone: phone.trim() || null,
          course,
        }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFeedback({ type: 'error', text: payload.error || 'Não foi possível inscrever-te. Tenta novamente.' });
        setSubmitting(false);
        return;
      }

      // Sucesso — revela na mesma os documentos.
      revealDocs();
    } catch {
      setFeedback({ type: 'error', text: 'Erro de ligação. Tenta novamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* CTA principal */}
      {!revealed && (
        <div className="rounded-2xl border border-black/15 bg-white p-6 sm:p-8 text-center shadow-sm">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#16a34a]/30 bg-[#f0fdf4] px-3.5 py-1.5 text-xs font-semibold text-[#15803d]">
            <span aria-hidden>✓</span> Correção completa, reconstruída pela comunidade
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl font-black text-[#000000]">
            Vê o enunciado e a correção da prova
          </h2>
          <p className="mt-2 text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
            Reconstruímos a prova de Matemática do 9.º ano de 2026 com a ajuda da comunidade. Clica
            em baixo para abrires o enunciado e a resolução, questão a questão.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#000000] px-7 py-3.5 text-base font-bold text-white transition hover:bg-[#1a1a1a]"
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
              onClick={() => setActiveDoc('enunciado')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeDoc === 'enunciado' ? 'bg-[#000000] text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              Enunciado
            </button>
            <button
              type="button"
              onClick={() => setActiveDoc('correcao')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeDoc === 'correcao' ? 'bg-[#000000] text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              Correção
            </button>
          </div>

          <div className="rounded-2xl border border-black/15 bg-white p-3 sm:p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-black text-[#000000]">
                {activeDoc === 'enunciado' ? 'Enunciado da prova' : 'Correção da prova'}
              </h3>
              <a
                href={activeDoc === 'enunciado' ? ENUNCIADO_PDF : CORRECAO_PDF}
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-black transition hover:bg-black/5"
              >
                ⬇ Descarregar PDF
              </a>
            </div>
            <object
              key={activeDoc}
              data={activeDoc === 'enunciado' ? ENUNCIADO_PDF : CORRECAO_PDF}
              type="application/pdf"
              className="h-[80vh] w-full rounded-lg"
            >
              <div className="flex flex-col items-center gap-3 p-8 text-center text-gray-600">
                <p>O teu navegador não consegue mostrar o PDF aqui.</p>
                <a
                  href={activeDoc === 'enunciado' ? ENUNCIADO_PDF : CORRECAO_PDF}
                  className="rounded-lg bg-[#000000] px-4 py-2 font-semibold text-white"
                >
                  Abrir o PDF numa nova página
                </a>
              </div>
            </object>
          </div>
        </div>
      )}

      {/* Modal funil */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f59e0b]/40 bg-[#fff7ed] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b45309]">
                  Novidade
                </span>
                <h3 className="mt-3 text-xl font-black text-[#000000]">As Explicações Top estão a chegar 🚀</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Vamos abrir explicações de qualidade para praticamente todas as disciplinas, a um
                  preço acessível. Queres entrar na lista de espera?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar"
                className="-mr-1 -mt-1 rounded-lg p-1.5 text-gray-400 transition hover:bg-black/5 hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Curso / disciplina</label>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm focus:border-black focus:outline-none"
                >
                  {COURSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="O teu nome"
                className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm focus:border-black focus:outline-none"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="O teu email"
                className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm focus:border-black focus:outline-none"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telemóvel (opcional)"
                className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm focus:border-black focus:outline-none"
              />

              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-black/10 bg-gray-50 p-3">
                <input
                  type="checkbox"
                  checked={joinWaitlist}
                  onChange={(e) => setJoinWaitlist(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-black"
                />
                <span className="text-sm text-gray-700">
                  Sim, quero entrar na lista de espera das Explicações Top.
                </span>
              </label>

              {feedback && (
                <p className={`text-sm ${feedback.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                  {feedback.text}
                </p>
              )}

              <button
                type="button"
                onClick={handleContinue}
                disabled={submitting}
                className="w-full rounded-xl bg-[#000000] px-5 py-3 text-base font-bold text-white transition hover:bg-[#1a1a1a] disabled:opacity-60"
              >
                {submitting ? 'A inscrever…' : 'Seguir para o enunciado →'}
              </button>

              <p className="text-center text-xs text-gray-400">
                Não é preciso inscreveres-te para veres o enunciado — basta desativar a opção acima.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
