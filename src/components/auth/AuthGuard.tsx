
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

console.log("DEBUG: /src/components/auth/AuthGuard.tsx - FILE PARSED");

export function AuthGuard({ children }: { children: ReactNode }) {
  console.log("DEBUG: /src/components/auth/AuthGuard.tsx - AuthGuard rendering");
  const { isAuthenticated, currentUser } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    console.log("DEBUG: /src/components/auth/AuthGuard.tsx - useEffect triggered", { isAuthenticated, currentUser });
    
    if (currentUser === undefined) {
      // Auth state is still loading from Firebase
      console.log("DEBUG: /src/components/auth/AuthGuard.tsx - Auth state loading (currentUser is undefined)");
      return; 
    }
    
    if (!isAuthenticated) { // currentUser is null
        console.log("DEBUG: /src/components/auth/AuthGuard.tsx - Not authenticated, redirecting to /login");
        router.replace('/login');
    } else { // currentUser is a User object
        console.log("DEBUG: /src/components/auth/AuthGuard.tsx - Authenticated, allowing access.");
    }
  }, [isAuthenticated, currentUser, router]);

  if (currentUser === undefined) { 
    console.log("DEBUG: /src/components/auth/AuthGuard.tsx - Rendering Skeleton because currentUser is undefined");
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Skeleton className="h-12 w-12 rounded-full mb-4" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    console.log("DEBUG: /src/components/auth/AuthGuard.tsx - Authenticated, rendering children");
    return <>{children}</>;
  }

  // Fallback rendering while redirecting (should be transient)
  console.log("DEBUG: /src/components/auth/AuthGuard.tsx - Not authenticated, rendering redirect message (fallback)");
   return (
     <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p>Redirecionando para o login...</p>
     </div>
  );
}
