"use client";
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { DataService } from '@/lib/dataService';
import { timelineMock } from '@/lib/timelineMock';

const MONTHS = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

export default function TimelinePage() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const palettes = [
    { card: 'bg-gradient-to-br from-green-50 to-green-100', border: 'border-green-200', box: 'bg-green-300', accent: 'text-green-800', hex: '#86EFAC' },
    { card: 'bg-gradient-to-br from-amber-50 to-orange-50', border: 'border-amber-200', box: 'bg-amber-300', accent: 'text-amber-800', hex: '#FCD34D' },
    { card: 'bg-gradient-to-br from-blue-50 to-blue-100', border: 'border-blue-200', box: 'bg-blue-300', accent: 'text-blue-800', hex: '#93C5FD' },
    { card: 'bg-gradient-to-br from-orange-50 to-orange-100', border: 'border-orange-200', box: 'bg-orange-300', accent: 'text-orange-800', hex: '#FDBA74' },
  ];

  const years = Array.from(new Set(timelineMock.map((t) => new Date(t.data).getUTCFullYear()))).sort((a,b) => a - b);

  useEffect(() => {
    if (years.length) setSelectedYear((s) => s ?? years[0]);
  }, [years]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const dashboardStats = await DataService.getDashboardStats();
        if (dashboardStats) setStats(dashboardStats);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const elems = Array.from(root.querySelectorAll('.tl-item')) as HTMLElement[];
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('tl-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    elems.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [selectedYear]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-blue-50 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-300 opacity-20 animate-pulse" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
        <div className="absolute top-1/4 -left-8 w-32 h-32 bg-green-300 opacity-15 animate-pulse delay-1000" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-blue-300 opacity-25 animate-pulse delay-500" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
        <div className="absolute bottom-12 left-12 w-20 h-20 bg-amber-300 opacity-20 animate-pulse delay-700" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
      </div>

      <main className="relative z-10 px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-700 via-amber-600 to-green-800 bg-clip-text text-transparent">Linha do Tempo</h1>
            <p className="text-gray-700 mt-2">Principais marcos do Projeto Moedas Narciso</p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="flex gap-6 items-center">
              {years.map((y) => (
                <div
                  key={y}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedYear(y)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedYear(y); }}
                  className={`cursor-pointer select-none ${y === selectedYear ? 'text-green-700 font-semibold' : 'text-gray-600'}`}
                >
                  {y}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 border border-white/20">
            <div ref={containerRef} className="relative">
              <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-green-300 to-amber-300 opacity-40"></div>

              <div className="flex flex-col gap-6">
                {timelineMock
                  .filter((it) => new Date(it.data).getUTCFullYear() === selectedYear)
                  .sort((a,b) => b.data - a.data)
                  .map((item, idx) => {
                    const d = new Date(item.data);
                    const dd = String(d.getUTCDate()).padStart(2, '0');
                    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
                    const yyyy = d.getUTCFullYear();
                    const isLeft = idx % 2 !== 0;
                    const palette = palettes[idx % palettes.length];

                    const dateBoxContent = (
                      <>
                        {item.data_estilo === 'ano' ? (
                            <div className={`text-center ${palette.accent} p-2`}>
                                <div className="text-3xl font-bold">{yyyy}</div>
                            </div>
                        ) : item.data_estilo === 'mes' ? (
                            <div className={`text-center ${palette.accent} p-2`}>
                                <div className="text-xl font-bold tracking-wider">{MONTHS[Number(mm) - 1]}</div>
                                <div className="text-sm opacity-75">{yyyy}</div>
                            </div>
                        ) : (
                            <div className={`text-center ${palette.accent} p-2`}>
                                <div className="text-2xl font-bold">{dd}</div>
                                <div className="text-xs uppercase tracking-wider">{MONTHS[Number(mm) - 1]}</div>
                                <div className="text-xs opacity-75">{yyyy}</div>
                            </div>
                        )}
                      </>
                    );

                    return (
                      <article key={item.id} className={`tl-item relative md:flex md:items-start ${isLeft ? 'md:justify-end' : 'md:justify-start'}`}>
                        <svg
                          className="tl-hex absolute top-1/2 left-8 md:left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                          width="36"
                          height="40"
                          viewBox="0 0 18 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9 0L17.6603 5V15L9 20L0.339746 15V5L9 0Z"
                            fill={palette.hex}
                            stroke="white"
                            strokeWidth="1"
                          />
                        </svg>
                        <div className={`tl-anim w-full pl-16 md:pl-0 md:w-1/2 relative md:flex ${isLeft ? 'justify-start md:pl-8' : 'justify-end md:pr-8'}`}>
                          <div className={`p-4 rounded-md border shadow-md flex gap-4 items-start ${palette.card} ${palette.border}`}>
                            {!item.foto && (
                              <div className={`flex-shrink-0 flex items-center justify-center rounded-md ${palette.box}`} style={{ width: 72, height: 72 }}>
                                {dateBoxContent}
                              </div>
                            )}
                            <div className="flex-1">
                              {item.foto && (
                                <div className="relative mb-3 max-w-sm mx-auto">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={item.foto}
                                    alt={item.titulo}
                                    className="w-full h-44 object-cover rounded"
                                  />
                                  <div className={`absolute top-[3px] ${isLeft ? 'left-[3px]' : 'right-[3px]'} flex-shrink-0 flex items-center justify-center rounded-md ${palette.box} p-2`}>
                                    {dateBoxContent}
                                  </div>
                                </div>
                              )}
                              <h4 className="font-semibold text-gray-800">{item.titulo}</h4>
                              <p className="text-sm text-gray-700">{item.descricao}</p>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .tl-item { overflow: visible; }

        @keyframes slide-in-left {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: translateX(-50%) translateY(-50%) scale(0); }
          to   { transform: translateX(-50%) translateY(-50%) scale(1); }
        }

        .tl-anim, .tl-hex {
          opacity: 0;
        }

        .tl-hex {
            transform: translateX(-50%) translateY(-50%) scale(0);
        }

        @media (max-width: 767px) {
          .tl-visible .tl-anim {
            animation: slide-in-right 0.7s ease-out forwards;
          }
        }

        @media (min-width: 768px) {
          .tl-visible.tl-item:nth-child(odd) .tl-anim {
            animation: slide-in-left 0.7s ease-out forwards;
          }
          .tl-visible.tl-item:nth-child(even) .tl-anim {
            animation: slide-in-right 0.7s ease-out forwards;
          }
        }

        .tl-visible .tl-hex {
          animation: scale-in 0.5s ease-out forwards;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}