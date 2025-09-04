
// src/components/layout/AppLayout.tsx
import type { ReactNode } from 'react';
import { Header } from './Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/SidebarNav';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider> {/* SidebarProvider wraps components that use useSidebar */}
        <div className="flex h-screen w-full overflow-hidden bg-background"> {/* Added w-full */}
          <Sidebar 
            collapsible="icon" 
            className="hidden md:flex md:flex-col md:border-r bg-sidebar text-sidebar-foreground"
          > 
            <SidebarNav />
          </Sidebar>
          <SidebarInset className="flex flex-1 flex-col overflow-hidden"> {/* SidebarInset handles main content area */}
            <Header />
            <main className="flex-1 w-full overflow-y-auto p-6"> {/* Added w-full, Main content with padding and scroll */}
              {children} {/* Render the actual page content */}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
