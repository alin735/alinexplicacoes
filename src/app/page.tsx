'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0d2f4a] via-[#1a5276] to-[#2980b9]">
          {/* Math rain */}
          <MathRain />

          {/* Radial glow */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5dade2]/10 rounded-full blur-3xl animate-float" />
          </div>

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <div
              className={`transition-all duration-1000 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-4 leading-tight">
                Explicações{' '}
                <span className="bg-gradient-to-r from-[#5dade2] to-[#a3d9ff] bg-clip-text text-transparent">
                  com o Alin
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-white/70 mb-12 max-w-2xl mx-auto">
                Matemática · Físico-Química · Biologia-Geologia · Português
              </p>
            </div>

            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-300 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <Link
                href="/marcar"
                className="group relative px-8 py-4 bg-white text-[#1a5276] font-bold rounded-2xl text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Marcar explicação
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#3498db] to-[#5dade2] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute inset-0 flex items-center justify-center gap-2 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Marcar explicação
                </span>
              </Link>

              <Link
                href="/aulas"
                className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl text-lg border-2 border-white/20 hover:bg-white/20 hover:border-white/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Minhas aulas
              </Link>
            </div>
          </div>

          {/* Bottom wave removed */}
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-[#0d2f4a] mb-4">
              Como funciona?
            </h2>
            <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
              Marcas a tua explicação, tens a aula, e depois podes rever tudo.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: 'Marca a explicação',
                  desc: 'Escolhe a disciplina, o dia e a hora que te convém.',
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: 'Tem a aula',
                  desc: 'Explicação personalizada ao teu ritmo e necessidades.',
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: 'Revê o material',
                  desc: 'Acede ao sumário, materiais e observações de cada aula.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center group"
                >
                  <div className="w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-[#3498db]/10 to-[#5dade2]/10 rounded-2xl flex items-center justify-center text-[#3498db] group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-[#3498db] group-hover:to-[#5dade2] group-hover:text-white transition-all duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#0d2f4a] mb-3">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Subjects Section */}
        <section className="relative py-20 px-4 bg-gradient-to-br from-[#0d2f4a] via-[#1a5276] to-[#2980b9] overflow-hidden">
          <MathRain />
          <div className="relative z-10 max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
              Disciplinas disponíveis
            </h2>
            <p className="text-center text-white/60 mb-16 max-w-xl mx-auto">
              Explicações individuais para as disciplinas que mais precisas.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  name: 'Matemática',
                  icon: (
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2 14l4 6 6-16h10" />
                    </svg>
                  ),
                },
                {
                  name: 'Físico-Química',
                  icon: (
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  ),
                },
                {
                  name: 'Biologia-Geologia',
                  icon: (
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                    </svg>
                  ),
                },
                {
                  name: 'Português',
                  icon: (
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  ),
                },
              ].map((subj, i) => (
                <Link
                  key={i}
                  href="/marcar"
                  className="bg-white rounded-2xl p-6 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#3498db]/10 to-[#5dade2]/10 rounded-2xl flex items-center justify-center text-[#3498db] group-hover:bg-gradient-to-br group-hover:from-[#3498db] group-hover:to-[#5dade2] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                    {subj.icon}
                  </div>
                  <h3 className="text-[#0d2f4a] font-semibold text-sm sm:text-base">{subj.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
