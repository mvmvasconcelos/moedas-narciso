
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const { isAuthenticated, teacherName } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if auth state is determined (teacherName is not undefined)
    if (teacherName !== undefined) { 
      if (!isAuthenticated) {
        router.replace('/login');
      }
      // If authenticated, do nothing. 
      // The Next.js router will render the content from (authenticated)/page.tsx for the '/' path,
      // as AuthGuard within (authenticated)/layout.tsx will permit access.
    }
  }, [isAuthenticated, teacherName, router]);

  // If AuthContext is still loading its initial state (teacherName is undefined)
  if (teacherName === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  // If AuthContext has loaded:
  // If authenticated, this component yields to (authenticated)/page.tsx. Returning null is appropriate.
  // If not authenticated, the useEffect above should have redirected. This is a fallback.
  return isAuthenticated ? null : (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecionando para o login...</p>
    </div>
  );
}
