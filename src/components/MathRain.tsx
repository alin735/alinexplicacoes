'use client';

import { useEffect, useRef } from 'react';

const SYMBOLS = ['∑', '∫', 'π', '√', '∞', 'Δ', '∂', 'θ', 'α', 'β', 'λ', '÷', '×', '±', '≈', '≠', '∈', '⊂', 'ℝ'];

export default function MathRain() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function createSymbol() {
      if (!container) return;
      const span = document.createElement('span');
      span.className = 'math-symbol';
      span.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      span.style.left = Math.random() * 100 + '%';
      span.style.fontSize = (1.2 + Math.random() * 2) + 'rem';
      span.style.animationDuration = (8 + Math.random() * 12) + 's';
      span.style.animationDelay = Math.random() * 2 + 's';
      container.appendChild(span);
      setTimeout(() => span.remove(), 22000);
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
