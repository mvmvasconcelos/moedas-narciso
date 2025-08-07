"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = '/sistema' }: ProtectedRouteProps) {
  const { isAuthenticated, teacherName } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (teacherName === undefined) {
      // Estado de autenticação ainda carregando
      return; 
    }
    
    if (!isAuthenticated) { 
      // Usuário não está autenticado, redirecionar para login
      router.replace(redirectTo);
    }
  }, [isAuthenticated, teacherName, router, redirectTo]);

  // Mostra um loader enquanto verifica o estado de autenticação
  if (teacherName === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <Skeleton className="h-12 w-12 rounded-full mb-4" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }
  
  // Se não estiver autenticado, não renderiza nada (vai redirecionar)
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <p>Redirecionando para o login...</p>
      </div>
    );
  }

  // Se estiver autenticado, renderiza o conteúdo da página
  return <>{children}</>;
}
