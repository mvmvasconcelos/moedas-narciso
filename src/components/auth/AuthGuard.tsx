
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
    // Only redirect if auth state is determined (teacherName is not undefined) 
    // and user is not authenticated.
    if (teacherName !== undefined && !isAuthenticated) {
        router.replace('/login');
    }
  }, [isAuthenticated, teacherName, router]);

  // If auth state is still loading (teacherName is undefined), show skeleton
  if (teacherName === undefined) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Skeleton className="h-12 w-12 rounded-full mb-4" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }
  
  // If auth state is determined AND user is authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If auth state is determined BUT user is not authenticated,
  // useEffect should have initiated a redirect. Show a fallback message.
  // This state should be transient.
  return (
     <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p>Redirecionando para o login...</p>
     </div>
  );
}
