"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function SistemaPage() {
  const { isAuthenticated, teacherName } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Protegendo contra casos onde o contexto ainda não está totalmente carregado
    if (teacherName === undefined) {
      return; // Estado ainda carregando, não fazer nada
    }
    
    // Pequeno timeout para evitar problemas de renderização
    const timer = setTimeout(() => {
      if (isAuthenticated) { 
        router.replace('/dashboard');
      } else { 
        router.replace('/login');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, teacherName, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      {teacherName === undefined ? (
        // Exibir um indicador de carregamento quando o estado ainda não foi determinado
        <p>Carregando...</p>
      ) : (
        <p>{isAuthenticated ? 'Redirecionando para o painel...' : 'Redirecionando para o login...'}</p>
      )}
    </div>
  );
}
