"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, teacherName } = useAuth(); // teacherName check if context is loading
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    // Check if auth state is determined (teacherName will be null initially, then set)
    if (teacherName !== undefined) { // Check if context has initialized
        if (!isAuthenticated) {
            router.replace('/login');
        } else {
            setIsLoading(false);
        }
    }
  }, [isAuthenticated, teacherName, router]);

  if (isLoading && teacherName === undefined) { // Context not yet initialized
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Skeleton className="h-12 w-12 rounded-full mb-4" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }
  
  if (!isAuthenticated) { // Handles the case where not authenticated after context load
    return (
         <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <p>Redirecionando para o login...</p>
         </div>
    );
  }


  return <>{children}</>;
}
