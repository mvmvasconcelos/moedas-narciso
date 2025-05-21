
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const { isAuthenticated, currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser === undefined) {
      // Auth state is still loading from Firebase
      return; 
    }

    if (isAuthenticated) { // currentUser is a User object
      console.log("Authenticated, redirecting to /dashboard");
      router.replace('/dashboard');
    } else { // currentUser is null
      console.log("DEBUG: src/app/page.tsx - Not authenticated, redirecting to /login");
      router.replace('/login');
    }
  }, [isAuthenticated, currentUser, router]);

  // Show loading message while Firebase auth state (currentUser) is being determined
  if (currentUser === undefined) { // Check if the user is still loading
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }
  // Fallback rendering while redirecting
   return (
    <div className="flex items-center justify-center min-h-screen">
      <p>{isAuthenticated ? 'Redirecionando para o painel...' : 'Redirecionando para o login...'}</p>
    </div>
  );
}
