
// src/app/(authenticated)/layout.tsx
console.log("DEBUG: /src/app/(authenticated)/layout.tsx - FILE PARSED (Restoring AppLayout)"); // Mudança no log
import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout'; // Importar AppLayout

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  console.log("DEBUG: /src/app/(authenticated)/layout.tsx - AuthenticatedLayout FUNCTION CALLED (with AppLayout)"); // Mudança no log
  return <AppLayout>{children}</AppLayout>; // Usar AppLayout
}
