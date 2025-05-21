
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

console.log("DEBUG: src/app/page.tsx - FILE PARSED");

export default function HomePage() {
  console.log("DEBUG: src/app/page.tsx - HomePage rendering");
  const { isAuthenticated, currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("DEBUG: src/app/page.tsx - useEffect triggered", { isAuthenticated, currentUser });
    
    if (currentUser === undefined) {
      // Auth state is still loading from Firebase
      console.log("DEBUG: src/app/page.tsx - Auth state loading (currentUser is undefined)");
      return; 
    }

    if (isAuthenticated) { // currentUser is a User object
      console.log("DEBUG: src/app/page.tsx - Authenticated, redirecting to /dashboard");
      router.replace('/dashboard');
    } else { // currentUser is null
      console.log("DEBUG: src/app/page.tsx - Not authenticated, redirecting to /login");
      router.replace('/login');
    }
  }, [isAuthenticated, currentUser, router]);

  // Show loading message while Firebase auth state (currentUser) is being determined
  if (currentUser === undefined) {
    console.log("DEBUG: src/app/page.tsx - Rendering 'Carregando...' because currentUser is undefined");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  // Fallback rendering while redirecting
  console.log("DEBUG: src/app/page.tsx - Rendering redirect message", { isAuthenticated });
   return (
    <div className="flex items-center justify-center min-h-screen">
      <p>{isAuthenticated ? 'Redirecionando para o painel...' : 'Redirecionando para o login...'}</p>
    </div>
  );
}
