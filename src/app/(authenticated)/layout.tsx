
// import { AppLayout } from '@/components/layout/AppLayout'; // Temporarily removed
import type { ReactNode } from 'react';

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  console.log("AuthenticatedLayout rendering (SUPER SIMPLIFIED VERSION)"); // Debug log adicionado
  return (
    <div style={{ border: '5px solid red', padding: '20px', backgroundColor: 'lightyellow' }}>
      <h1 style={{ color: 'red', fontSize: '2em' }}>DEBUG: AuthenticatedLayout (Super Simplified)</h1>
      <p style={{ color: 'red' }}>Se você está vendo isso, AuthenticatedLayout está sendo renderizado.</p>
      <p style={{ color: 'red' }}>O problema anterior estava provavelmente no AppLayout ou em suas importações.</p>
      {children}
    </div>
  );
  // return <AppLayout>{children}</AppLayout>; // Temporarily removed
}
