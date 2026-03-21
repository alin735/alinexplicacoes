'use client';

import { useEffect, useRef } from 'react';

const SYMBOL_IMAGES = Array.from({ length: 23 }, (_, index) => `/brand-symbols/symbol-${String(index + 1).padStart(2, '0')}.png`);

export default function MathRain() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function createSymbol() {
      if (!container) return;
      const img = document.createElement('img');
      img.className = 'math-symbol-image';
      img.src = SYMBOL_IMAGES[Math.floor(Math.random() * SYMBOL_IMAGES.length)];
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.style.left = Math.random() * 100 + '%';

      const sizePx = 22 + Math.random() * 34;
      img.style.width = `${sizePx}px`;
      img.style.height = `${sizePx}px`;

      img.style.animationDuration = `${8 + Math.random() * 12}s`;
      img.style.animationDelay = `${Math.random() * 2}s`;
      img.style.opacity = `${0.03 + Math.random() * 0.04}`;
      container.appendChild(img);
      setTimeout(() => img.remove(), 22000);
    }

    // Initial batch
    const initTimeouts: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < 15; i++) {
      initTimeouts.push(setTimeout(createSymbol, i * 400));
    }
    const interval = setInterval(createSymbol, 1500);

    return () => {
      initTimeouts.forEach(clearTimeout);
      clearInterval(interval);
      if (container) container.innerHTML = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    />
  );
}
