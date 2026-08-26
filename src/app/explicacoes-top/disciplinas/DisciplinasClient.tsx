'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getCourseGroups, isKnownCourse, SCHOOL_YEARS } from '@/lib/secondary-subjects';

type LeadInfo = {
  email: string;
  fullName: string | null;
  course: string | null;
  answer: { subjects: string[]; schoolYear: string; otherSubject: string } | null;
};

export default function DisciplinasClient({ token }: { token: string }) {
  const [lead, setLead] = useState<LeadInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState<string[]>([]);
  const [schoolYear, setSchoolYear] = useState('');
  const [otherSubject, setOtherSubject] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Este link não é válido. Abre o link que recebeste por email.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const response = await fetch(`/api/waitlist-subjects?t=${encodeURIComponent(token)}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Não foi possível abrir o formulário.');

        setLead(payload);
        if (payload.answer) {
          setSelected(payload.answer.subjects || []);
          setSchoolYear(payload.answer.schoolYear || '');
          setOtherSubject(payload.answer.otherSubject || '');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível abrir o formulário.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const groups = useMemo(() => getCourseGroups(lead?.course), [lead?.course]);

  const toggle = (subject: string) => {
    setSelected((prev) =>
      prev.includes(subject) ? prev.filter((item) => item !== subject) : [...prev, subject],
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0 && !otherSubject.trim()) {
      setError('Escolhe pelo menos uma disciplina.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/waitlist-subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, subjects: selected, schoolYear, otherSubject }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Não foi possível guardar a resposta.');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível guardar a resposta.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-sm text-gray-500">A carregar...</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
          <h1 className="text-xl font-bold text-black">Resposta guardada</h1>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            Obrigado! Vou abrir primeiro as disciplinas mais pedidas e avisar-te por email
            assim que houver vagas nas tuas.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm text-gray-500 underline hover:text-black">
            Voltar a matematica.top
          </Link>
        </div>
      </main>
    );
  }

  if (!lead) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
          <h1 className="text-xl font-bold text-black">Link inválido</h1>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">{error}</p>
          <Link href="/explicacoes-top" className="mt-6 inline-block text-sm text-gray-500 underline hover:text-black">
            Ver as Explicações Top
          </Link>
        </div>
      </main>
    );
  }

  const name = (lead.fullName || '').trim().split(/\s+/)[0];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-black">
            {name ? `Olá, ${name}!` : 'Olá!'} De que disciplinas queres explicações?
          </h1>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            {isKnownCourse(lead.course)
              ? `Estas são as disciplinas de ${lead.course}. Escolhe as que te interessam, podes escolher mais do que uma.`
              : 'Escolhe as disciplinas que te interessam. Se faltar alguma, escreve-a no fim.'}
          </p>

          <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Que ano vais frequentar?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SCHOOL_YEARS.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSchoolYear(year)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    schoolYear === year
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.title} className="mt-7">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {group.title}
                {group.hint ? <span className="ml-2 font-normal normal-case text-gray-400">{group.hint}</span> : null}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.subjects.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => toggle(subject)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selected.includes(subject)
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-7">
            <label htmlFor="outra" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Falta alguma?
            </label>
            <input
              id="outra"
              type="text"
              value={otherSubject}
              onChange={(event) => setOtherSubject(event.target.value)}
              placeholder="Escreve aqui outra disciplina"
              className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black outline-none focus:border-black"
            />
          </div>

          {error && <p className="mt-5 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="mt-7 w-full rounded-xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'A guardar...' : 'Enviar resposta'}
          </button>
          <p className="mt-3 text-center text-xs text-gray-400">
            Podes voltar a este link e mudar a resposta quando quiseres.
          </p>
        </div>
      </div>
    </main>
  );
}
