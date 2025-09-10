"use client";

import React, { useEffect, useState } from 'react';
import ConsultaSaldo from './ConsultaSaldo';
import { DataService } from '@/lib/dataService';
import type { Student } from '@/lib/constants';

export default function ConsultaAlunoClient() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [retrying, setRetrying] = useState(false);

  const fetchPublic = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await DataService.getStudentsPublic();
      setStudents(data || []);
    } catch (err: any) {
      console.error('[ConsultaAlunoClient] fetchPublic failed', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublic();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4" />
          <div className="text-lg font-medium">Carregando alunos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-700">
          <div className="text-lg font-semibold mb-2">Não foi possível carregar a lista pública de alunos.</div>
          <div className="text-sm text-red-600 mb-4">{error.message}</div>
          <div>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-md shadow hover:bg-amber-600"
              onClick={async () => {
                try {
                  setRetrying(true);
                  await fetchPublic();
                } finally {
                  setRetrying(false);
                }
              }}
              disabled={retrying}
            >
              {retrying ? 'Tentando...' : 'Tentar novamente'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <ConsultaSaldo students={students} loadError={false} studentsLoading={false} />;
}
