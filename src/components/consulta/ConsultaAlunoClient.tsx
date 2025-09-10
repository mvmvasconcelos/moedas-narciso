"use client";

import React, { useEffect, useState, useRef } from 'react';
import ConsultaSaldo from './ConsultaSaldo';
import { useAuth } from '@/hooks/use-auth';

export default function ConsultaAlunoClient() {
  const { students, studentsLoading, studentsLoadError, isAuthenticated, refreshStudents } = useAuth();

  // Inicializa fetchingPublic como true imediatamente quando não há usuário
  // e não há alunos carregados ainda — evita renderização inicial com "0 alunos"
  const [fetchingPublic, setFetchingPublic] = useState<boolean>(() => {
    try {
      return !Boolean(isAuthenticated) && (!students || students.length === 0);
    } catch (e) {
      return false;
    }
  });

  // Estado para controlar tentativas manuais de retry e fallback após timeout
  const [retrying, setRetrying] = useState(false);
  const [fallbackTimedOut, setFallbackTimedOut] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Logs de debug para rastrear o estado inicial e mudanças
  useEffect(() => {
    console.debug('[ConsultaAlunoClient] mount/update', {
      isAuthenticated,
      studentsLength: Array.isArray(students) ? students.length : null,
      studentsLoading,
      studentsLoadError,
      fetchingPublic
    });
  }, [isAuthenticated, students, studentsLoading, studentsLoadError, fetchingPublic]);

  // Se não houver usuário autenticado, tentar carregar alunos publicamente
  useEffect(() => {
    let mounted = true;
    const tryLoadPublic = async () => {
      console.debug('[ConsultaAlunoClient] tryLoadPublic start', { isAuthenticated, studentsLength: students?.length, studentsLoading, fetchingPublic, studentsLoadError });
      if (isAuthenticated) {
        console.debug('[ConsultaAlunoClient] user authenticated - skipping public load');
        if (mounted) setFetchingPublic(false);
        return;
      }
      if (students && students.length > 0) {
        console.debug('[ConsultaAlunoClient] students already present - skipping public load');
        if (mounted) setFetchingPublic(false);
        return;
      }
      if (studentsLoading || fetchingPublic) {
        console.debug('[ConsultaAlunoClient] already loading - aborting additional fetch');
        return;
      }
      if (studentsLoadError) {
        console.debug('[ConsultaAlunoClient] previous load error - aborting public load');
        return;
      }

      console.debug('[ConsultaAlunoClient] initiating public refreshStudents()');
      if (mounted) setFetchingPublic(true);
      try {
        await refreshStudents();
        console.debug('[ConsultaAlunoClient] refreshStudents() resolved');
      } catch (e) {
        console.error('[ConsultaAlunoClient] refreshStudents() failed', e);
      } finally {
        if (mounted) setFetchingPublic(false);
      }
    };

    tryLoadPublic();
    return () => { mounted = false; };
  }, [isAuthenticated, students, studentsLoading, studentsLoadError, fetchingPublic, refreshStudents]);

  // Fallback timeout: se o carregamento demorar muito, permitir retry manual
  useEffect(() => {
    // se carregando, (re)inicia o timeout
    if (studentsLoading || fetchingPublic) {
      setFallbackTimedOut(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      console.debug('[ConsultaAlunoClient] starting fallback timeout (8s)');
      timeoutRef.current = window.setTimeout(() => {
        console.warn('[ConsultaAlunoClient] fallback timeout reached');
        setFallbackTimedOut(true);
      }, 8000);
    } else {
      // se não estiver carregando, limpa o timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (fallbackTimedOut) setFallbackTimedOut(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [studentsLoading, fetchingPublic]);

  if (studentsLoading || fetchingPublic) {
    // Se o fallback expirou, mostrar mensagem com botão de retry
    if (fallbackTimedOut) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-medium mb-3">Carregamento demorando mais que o esperado.</div>
            <div className="mb-4 text-sm text-gray-600">Verifique sua conexão ou tente novamente.</div>
            <div>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-md shadow hover:bg-amber-600"
                onClick={async () => {
                  console.debug('[ConsultaAlunoClient] retry button clicked (fallback)');
                  try {
                    setRetrying(true);
                    await refreshStudents();
                    console.debug('[ConsultaAlunoClient] refreshStudents() returned (fallback)');
                  } catch (e) {
                    console.error('Retry failed', e);
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

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4" />
          <div className="text-lg font-medium">Carregando alunos...</div>
        </div>
      </div>
    );
  }

  if (studentsLoadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-700">
          <div className="text-lg font-semibold mb-2">Não foi possível estabelecer conexão. Tente novamente mais tarde.</div>
          <div className="text-sm text-red-600 mb-4">Se o problema persistir, verifique a conexão com o banco de dados.</div>
          <div>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-md shadow hover:bg-amber-600"
              onClick={async () => {
                console.debug('[ConsultaAlunoClient] retry button clicked (error)');
                try {
                  setRetrying(true);
                  await refreshStudents();
                  console.debug('[ConsultaAlunoClient] refreshStudents() returned (error)');
                } catch (e) {
                  console.error('Retry failed', e);
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


  // Renderiza o componente de consulta passando o estado de loading
  return <ConsultaSaldo students={students || []} loadError={false} studentsLoading={studentsLoading} />;
}
