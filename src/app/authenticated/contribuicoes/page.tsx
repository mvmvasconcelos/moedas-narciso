"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContribuicoesRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const material = params.get('material');
    
    if (material) {
      router.replace(`/contribuicoes?material=${material}`);
    } else {
      router.replace('/contribuicoes');
    }
  }, [router]);

  return <div>Redirecionando para a nova página de contribuições...</div>;
}
