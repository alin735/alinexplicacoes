'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LessonCompleteButton({
  lessonId,
  initialCompleted,
}: {
  lessonId: string;
  initialCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = !completed;
    try {
      const res = await fetch('/api/portal/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, completed: next }),
      });
      if (res.ok) {
        setCompleted(next);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-full rounded-xl px-4 py-3.5 text-sm font-bold transition disabled:opacity-50 ${
        completed
          ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'bg-black text-white hover:bg-black/85'
      }`}
    >
      {loading
        ? 'A guardar…'
        : completed
          ? '✓ Aula concluída. Toca para anular'
          : 'Marcar aula como concluída'}
    </button>
  );
}
