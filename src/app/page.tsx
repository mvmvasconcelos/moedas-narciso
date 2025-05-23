"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const { isAuthenticated, teacherName } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (teacherName === undefined) {
      return; 
    }
    
    if (isAuthenticated) { 
      router.replace('/dashboard');
    } else { 
      router.replace('/login');
    }
  }, [isAuthenticated, teacherName, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>{isAuthenticated ? 'Redirecionando para o painel...' : 'Redirecionando para o login...'}</p>
    </div>
  );
}
