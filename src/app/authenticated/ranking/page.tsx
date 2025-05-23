"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RankingRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/ranking');
  }, [router]);

  return <div>Redirecionando para o novo ranking...</div>;
}