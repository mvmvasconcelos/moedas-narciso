
import type { ReactNode } from 'react';
import { Header } from './Header';
import { SidebarNav } from './SidebarNav';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset
} from '@/components/ui/sidebar'; // Removed unused SidebarTrigger

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider defaultOpen={true} collapsible="icon">
        <Sidebar variant="sidebar" side="left">
          <SidebarNav />
        </Sidebar>
        <SidebarInset> {/* This is a <main> tag: flex flex-col flex-1 min-h-screen */}
          <Header /> {/* You can add a temporary background to Header if needed for debugging its bounds */}
          {/* This div will be the main content area, taking remaining space */}
          <div className="flex-1 p-4 sm:p-6 md:p-8 bg-lime-400 border-4 border-red-500 overflow-y-auto">
            {/* Original {children} is commented out for debugging */}
            <div className="bg-yellow-200 p-10 rounded-lg shadow-lg">
              <h1 className="text-4xl text-black font-bold">DEBUG: TEST CONTENT</h1>
              <p className="text-xl text-gray-800 mt-2">
                If you see this yellow box within a lime green area with a red border, 
                then the AppLayout structure (including Header and content area) is mostly working.
                The issue might then be with the actual page content that was originally passed as children.
              </p>
              <p className="text-xl text-gray-800 mt-2">
                The overall page background should be a light green.
              </p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
