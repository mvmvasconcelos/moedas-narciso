
// Kept super simplified for debugging
console.log("DEBUG: /src/app/(authenticated)/layout.tsx - FILE PARSED");

import type { ReactNode } from 'react';

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  console.log("DEBUG: /src/app/(authenticated)/layout.tsx - AuthenticatedLayout FUNCTION CALLED (SUPER SIMPLIFIED VERSION)");
  return (
    <div style={{ border: '20px solid red', padding: '30px', backgroundColor: 'lightyellow', minHeight: '100vh' }}>
      <h1 style={{ color: 'darkred', fontSize: '3em' }}>DEBUG: AUTHENTICATED LAYOUT SUPER SIMPLIFIED</h1>
      {children}
    </div>
  );
}
