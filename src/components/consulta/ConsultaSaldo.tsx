"use client";

import React, { useMemo, useState } from 'react';
import type { Student } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  students: Student[];
  loadError?: boolean;
  studentsLoading?: boolean;
}

export default function ConsultaSaldo({ students, loadError, studentsLoading }: Props) {
  const effectiveLoading = !!studentsLoading;
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);

  // Detectar erro de carregamento: prioriza a flag passada pelo servidor
  const isLoadError = typeof loadError === 'boolean' ? loadError : (!students || students.length === 0);

  // Evitar usar console.error no cliente para não acionar overlays em dev;
  // apenas logar em debug para diagnóstico no console.
  React.useEffect(() => {
    if (isLoadError) {
      console.debug('ConsultaSaldo: falha ao carregar lista de alunos do banco de dados (loadError)');
    } else {
      console.debug('ConsultaSaldo: students length =', students.length);
    }
  }, [isLoadError, students]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const list = students || [];
    const res = list.filter(s => s.name.toLowerCase().includes(q)).slice(0, 10);
    console.debug('ConsultaSaldo: suggestions for', q, res.map(r => r.name));
    return res;
  }, [query, students]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-blue-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/4 -left-8 w-32 h-32 bg-green-300 rounded-full opacity-15 animate-pulse delay-1000"></div>
      </div>

      <main className="relative z-10 px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-700 via-amber-600 to-green-800 bg-clip-text text-transparent mb-3 leading-tight">
              Consulta Saldo de Moedas Narciso
            </h1>
            <p className="text-muted-foreground">Digite o nome do aluno</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border border-white/20 relative mx-2 sm:mx-0">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-yellow-200 to-amber-200 rounded-bl-full opacity-30"></div>
            <div className="relative z-10">
              <div className="w-full max-w-2xl mx-auto">
                <div className="mb-3 text-sm text-gray-600">Alunos carregados: {students ? students.length : 0}</div>

                <div className="relative">
                  {isLoadError ? (
                    <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">Ocorreu um erro na conexão com o banco de dados. Por favor, tente mais tarde.</div>
                  ) : (
                    <>
                      <Input
                        value={selected ? selected.name : query}
                        disabled={effectiveLoading}
                        onChange={e => {
                          setQuery(e.target.value);
                          setSelected(null);
                          setHighlightIndex(-1);
                        }}
                        onKeyDown={e => {
                          if (suggestions.length === 0) return;
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setHighlightIndex(prev => Math.min(prev + 1, suggestions.length - 1));
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setHighlightIndex(prev => Math.max(prev - 1, 0));
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            const idx = highlightIndex >= 0 ? highlightIndex : 0;
                            const s = suggestions[idx];
                            if (s) {
                              setSelected(s);
                              setQuery('');
                              setHighlightIndex(-1);
                            }
                          } else if (e.key === 'Escape') {
                            setHighlightIndex(-1);
                          }
                        }}
                        placeholder={effectiveLoading ? 'Carregando alunos...' : 'Digite o nome do aluno'}
                        aria-label="Pesquisar aluno"
                      />

                      {(!selected && suggestions.length > 0) && (
                        <ul role="listbox" aria-label="Sugestões de alunos" className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-background shadow-md scrollbar-thin scrollbar-thumb-amber-400">
                          {suggestions.map((s, i) => (
                            <li
                              key={s.id}
                              role="option"
                              aria-selected={highlightIndex === i}
                              className={
                                `cursor-pointer px-3 py-2 ${highlightIndex === i ? 'bg-muted-foreground/20' : 'hover:bg-muted-foreground/10'}`
                              }
                              onMouseDown={() => {
                                // usar onMouseDown para evitar perda de foco antes do click
                                setSelected(s);
                                setQuery('');
                                setHighlightIndex(-1);
                              }}
                              onMouseEnter={() => setHighlightIndex(i)}
                            >
                              {s.name} — {s.className}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-6">
                  {selected ? (
                    <div className="space-y-4 text-gray-700">
                      <div>
                        <div className="text-sm text-muted-foreground">Nome do Aluno</div>
                        <div className="text-lg font-medium">{selected.name}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Turma</div>
                        <div className="text-lg font-medium">{selected.className}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Moedas Narciso</div>
                        <div className="text-2xl font-semibold text-green-700">{selected.narcisoCoins}</div>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
