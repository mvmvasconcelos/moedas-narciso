
import type { ReactNode } from 'react';

console.log("DEBUG: /src/app/(authenticated)/layout.tsx - FILE PARSED");

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  console.log("DEBUG: /src/app/(authenticated)/layout.tsx - AuthenticatedLayout FUNCTION CALLED");
  return (
    <div style={{ border: '10px solid limegreen', padding: '20px', backgroundColor: 'lightgoldenrodyellow', minHeight: '100vh' }}>
      <h1 style={{ color: 'green', fontSize: '2em' }}>DEBUG: AUTHENTICATED LAYOUT MINIMAL</h1>
      <p style={{ color: 'green' }}>Este é o layout autenticado ultra simplificado.</p>
      {children}
    </div>
  );
}
