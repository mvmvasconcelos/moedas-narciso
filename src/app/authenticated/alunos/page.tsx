"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AlunosRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/alunos');
  }, [router]);

  return <div>Redirecionando para o novo gerenciamento de alunos...</div>;
}
