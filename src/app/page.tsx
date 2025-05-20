
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

console.log("DEBUG: src/app/page.tsx - FILE PARSED");

export default function HomePage() {
  console.log("DEBUG: src/app/page.tsx - HomePage rendering");
  const { isAuthenticated, teacherName } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("DEBUG: src/app/page.tsx - useEffect triggered", { isAuthenticated, teacherName });
    if (teacherName !== undefined) {
      if (!isAuthenticated) {
        console.log("DEBUG: src/app/page.tsx - Not authenticated, redirecting to /login");
        router.replace('/login');
      } else {
        console.log("DEBUG: src/app/page.tsx - Authenticated, redirecting to /dashboard");
        router.replace('/dashboard'); // Redirect to /dashboard when authenticated
      }
    } else {
      console.log("DEBUG: src/app/page.tsx - Auth state not determined yet (teacherName is undefined)");
    }
  }, [isAuthenticated, teacherName, router]);

  if (teacherName === undefined) {
    console.log("DEBUG: src/app/page.tsx - Rendering 'Carregando...' because teacherName is undefined");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  // If auth state is determined, useEffect will handle redirection.
  // Show a generic message while redirecting.
  console.log("DEBUG: src/app/page.tsx - Rendering redirect or loading message based on auth state", { isAuthenticated });
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>{isAuthenticated ? 'Redirecionando para o painel...' : 'Redirecionando para o login...'}</p>
    </div>
  );
}
