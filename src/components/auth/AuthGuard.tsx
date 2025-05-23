
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

console.log("DEBUG: /src/components/auth/AuthGuard.tsx - FILE PARSED (Mock Auth Version)");

export function AuthGuard({ children }: { children: ReactNode }) {
  console.log("DEBUG: /src/components/auth/AuthGuard.tsx - AuthGuard rendering (Mock Auth Version)");
  const { isAuthenticated, teacherName } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    console.log("DEBUG: /src/components/auth/AuthGuard.tsx - useEffect triggered (Mock Auth Version)", { isAuthenticated, teacherName });
    
    if (teacherName === undefined) {
      console.log("DEBUG: /src/components/auth/AuthGuard.tsx - Auth state loading (teacherName is undefined) (Mock Auth Version)");
      return; 
    }
    
    if (!isAuthenticated) { 
        console.log("DEBUG: /src/components/auth/AuthGuard.tsx - Not authenticated, redirecting to /login (Mock Auth Version)");
        router.replace('/login');
    } else { 
        console.log("DEBUG: /src/components/auth/AuthGuard.tsx - Authenticated, allowing access. (Mock Auth Version)");
    }
  }, [isAuthenticated, teacherName, router]);

  if (teacherName === undefined) { 
    console.log("DEBUG: /src/components/auth/AuthGuard.tsx - Rendering Skeleton because teacherName is undefined (Mock Auth Version)");
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Skeleton className="h-12 w-12 rounded-full mb-4" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    console.log("DEBUG: /src/components/auth/AuthGuard.tsx - Authenticated, rendering children (Mock Auth Version)");
    return <>{children}</>;
  }

   console.log("DEBUG: /src/components/auth/AuthGuard.tsx - Not authenticated, rendering redirect message (fallback) (Mock Auth Version)");
   return (
     <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p>Redirecionando para o login...</p>
     </div>
  );
}
