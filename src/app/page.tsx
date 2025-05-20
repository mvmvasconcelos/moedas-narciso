// This page will be rendered within the (authenticated)/layout.tsx if the user is authenticated.
// The actual dashboard content is in src/app/(authenticated)/page.tsx
// This file can be minimal or redirect logic if not using route groups for auth boundary

// For simplicity with the current structure, (authenticated)/page.tsx is the true dashboard.
// This src/app/page.tsx could redirect or be a landing page if there was one.
// Since we are using (authenticated) group, this file effectively becomes part of the public routes
// if not handled by middleware or a top-level guard.
// However, our AuthGuard is in (authenticated)/layout.tsx, so this page won't be hit directly for authenticated users.
// If a user lands here unauthenticated, they would typically be redirected by a global guard or see a public page.
// Let's assume this page might be hit if the route structure or auth guard changes.
// For now, it's best to redirect to login if not authenticated or show a loader.

"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const { isAuthenticated, teacherName } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if auth state is determined
    if (typeof teacherName !== 'undefined') { // context has loaded
      if (isAuthenticated) {
        router.replace('/'); // This should already be handled by AuthGuard if it's the dashboard itself.
                             // If this `page.tsx` is intended as the actual `/` path for authenticated users.
                             // It means it should be inside the `(authenticated)` group.
                             // Current setup has `(authenticated)/page.tsx` as dashboard.
                             // This outer `page.tsx` will redirect to `/login` if not authed.
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, teacherName, router]);

  // Show loading or minimal content while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Carregando...</p>
    </div>
  );
}
