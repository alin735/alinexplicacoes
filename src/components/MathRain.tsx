'use client';

import { useEffect, useRef } from 'react';

const EXCLUDED_SYMBOLS = new Set(['symbol-01.png', 'symbol-21.png', 'symbol-22.png', 'symbol-23.png']);
const SYMBOL_IMAGES = Array.from({ length: 23 }, (_, index) => `symbol-${String(index + 1).padStart(2, '0')}.png`)
  .filter((name) => !EXCLUDED_SYMBOLS.has(name))
  .map((name) => `/brand-symbols/${name}`);

type MathRainProps = {
  speed?: 'default' | 'fast';
};

const SPEED_CONFIG = {
  default: {
    initialSymbols: 15,
    initialStaggerMs: 400,
    spawnIntervalMs: 1500,
  },
  fast: {
    initialSymbols: 22,
    initialStaggerMs: 140,
    spawnIntervalMs: 700,
  },
} as const;

export default function MathRain({ speed = 'default' }: MathRainProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const config = SPEED_CONFIG[speed];

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
    for (let i = 0; i < config.initialSymbols; i++) {
      initTimeouts.push(setTimeout(createSymbol, i * config.initialStaggerMs));
    }
    const interval = setInterval(createSymbol, config.spawnIntervalMs);

    return () => {
      initTimeouts.forEach(clearTimeout);
      clearInterval(interval);
      if (container) container.innerHTML = '';
    };
  }, [speed]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    />
  );
}
