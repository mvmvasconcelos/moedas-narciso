
import { AppLayout } from '@/components/layout/AppLayout';
import type { ReactNode } from 'react';

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  console.log("AuthenticatedLayout rendering"); // Debug log adicionado
  return <AppLayout>{children}</AppLayout>;
}
