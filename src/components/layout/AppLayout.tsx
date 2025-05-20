
import type { ReactNode } from 'react';
import { Header } from './Header';
import { SidebarNav } from './SidebarNav';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider defaultOpen={true} collapsible="icon"> {/* Default to open, collapsible to icon */}
        <Sidebar variant="sidebar" side="left">
          <SidebarNav />
        </Sidebar>
        <SidebarInset> {/* This component renders a <main> tag which is flex flex-col */}
          <Header />
          {/* This div will be the main content area, taking remaining space */}
          <div className="flex-1 p-4 sm:p-6 md:p-8 bg-background overflow-y-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
