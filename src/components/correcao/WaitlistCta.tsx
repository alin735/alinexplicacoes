'use client';

import { useEffect, useState } from 'react';
import WaitlistModal from './WaitlistModal';
import { hasJoinedWaitlist } from './waitlist-utils';

export default function WaitlistCta() {
  const [open, setOpen] = useState(false);
  const [joined, setJoined] = useState(false);

  // Verifica, depois de montar, se a pessoa já está inscrita neste dispositivo.
  useEffect(() => {
    setJoined(hasJoinedWaitlist());
  }, []);

  if (joined) {
    return (
      <p className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#16a34a]/30 bg-[#f0fdf4] px-4 py-2.5 text-sm font-semibold text-[#15803d]">
        <span aria-hidden>✓</span> Já estás na lista de espera das Explicações Top.
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-black hover:text-white"
      >
        Entrar na lista de espera →
      </button>

      <WaitlistModal
        open={open}
        mode="waitlist"
        onClose={() => setOpen(false)}
        onJoined={() => {
          setJoined(true);
          setOpen(false);
        }}
      />
    </>
  );
}
