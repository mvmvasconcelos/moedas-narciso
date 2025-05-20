
// src/components/layout/AppLayout.tsx
console.log("DEBUG: /src/components/layout/AppLayout.tsx - FILE PARSED");
import type { ReactNode } from 'react';
import { Header } from './Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/SidebarNav';

export function AppLayout({ children }: { children: ReactNode }) {
  console.log("DEBUG: /src/components/layout/AppLayout.tsx - AppLayout FUNCTION CALLED (Restoring Full Structure)");
  return (
    <AuthGuard>
      <SidebarProvider> {/* SidebarProvider wraps components that use useSidebar */}
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar 
            collapsible="icon" 
            className="hidden md:flex md:flex-col md:border-r bg-sidebar text-sidebar-foreground"
          > {/* Apply sidebar theme colors and set collapsible to icon */}
            <SidebarNav />
          </Sidebar>
          <SidebarInset className="flex flex-1 flex-col overflow-hidden"> {/* SidebarInset handles main content area */}
            <Header />
            <main className="flex-1 overflow-y-auto p-6"> {/* Main content with padding and scroll */}
              {children} {/* Render the actual page content */}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
