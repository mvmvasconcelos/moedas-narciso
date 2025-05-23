"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthenticatedRootPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecionando para o dashboard...</p>
    </div>
  );
}
