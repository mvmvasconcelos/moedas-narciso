"use client";
import { useContext, useMemo } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Memoiza o contexto para evitar re-renderizações desnecessárias
  // quando o componente pai renderiza, mas o contexto não mudou
  return useMemo(() => context, [
    context.isAuthenticated,
    context.teacherName,
    context.students.length,
  ]);
};
