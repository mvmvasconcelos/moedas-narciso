
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

console.log("DEBUG: src/app/page.tsx - FILE PARSED (Mock Auth Version)");

export default function HomePage() {
  console.log("DEBUG: src/app/page.tsx - HomePage rendering (Mock Auth Version)");
  const { isAuthenticated, teacherName } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("DEBUG: src/app/page.tsx - useEffect triggered (Mock Auth Version)", { isAuthenticated, teacherName });
    
    if (teacherName === undefined) {
      console.log("DEBUG: src/app/page.tsx - Auth state loading (teacherName is undefined) (Mock Auth Version)");
      return; 
    }
    
    if (isAuthenticated) { 
      console.log("DEBUG: src/app/page.tsx - Authenticated, redirecting to /dashboard (Mock Auth Version)");
      router.replace('/dashboard');
    } else { 
      console.log("DEBUG: src/app/page.tsx - Not authenticated, redirecting to /login (Mock Auth Version)");
      router.replace('/login');
    }
  }, [isAuthenticated, teacherName, router]);

  if (teacherName === undefined) { 
    console.log("DEBUG: src/app/page.tsx - Rendering 'Carregando...' because teacherName is undefined (Mock Auth Version)");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }
  
  console.log("DEBUG: src/app/page.tsx - Rendering redirect or loading message based on auth state (Mock Auth Version)", { isAuthenticated });
   return (
    <div className="flex items-center justify-center min-h-screen">
      <p>{isAuthenticated ? 'Redirecionando para o painel...' : 'Redirecionando para o login...'}</p>
    </div>
  );
}
