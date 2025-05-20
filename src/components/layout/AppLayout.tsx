
import type { ReactNode } from 'react';
import { Header } from './Header';
import { SidebarNav } from './SidebarNav';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset,
  SidebarTrigger // For manual toggle if needed elsewhere, not primary for this layout
} from '@/components/ui/sidebar';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider defaultOpen={true} collapsible="icon"> {/* Default to open, collapsible to icon */}
        <Sidebar variant="sidebar" side="left">
          <SidebarNav />
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 p-4 sm:p-6 md:p-8 bg-background">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
