
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, teacherName } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (teacherName === undefined) {
      return; 
    }
      if (!isAuthenticated) { 
        router.replace('/sistema');
    }
  }, [isAuthenticated, teacherName, router]);
  if (teacherName === undefined) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Skeleton className="h-12 w-12 rounded-full mb-4" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <>{children}</>;
  }

   return (
     <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p>Redirecionando para o login...</p>
     </div>
  );
}
