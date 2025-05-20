
import type { ReactNode } from 'react';
import { Header } from './Header';
import { AuthGuard } from '@/components/auth/AuthGuard';

// Removed SidebarProvider, Sidebar, SidebarNav, SidebarInset for debugging

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-purple-700 text-white border-8 border-pink-500 p-4"> {/* Wrapper with visible debug style */}
        <Header /> {/* Assume Header is okay for now */}
        <main className="flex-1 mt-4 p-4 bg-orange-500 border-4 border-yellow-500 overflow-y-auto"> {/* Main content area with visible debug style */}
          <div className="bg-teal-200 p-10 rounded-lg shadow-lg">
            <h1 className="text-4xl text-black font-bold">DEBUG: AppLayout Simplified</h1>
            <p className="text-xl text-gray-800 mt-2">
              This is a placeholder inside the 'main' area of AppLayout.
            </p>
            <p className="text-xl text-gray-800 mt-2">
              The original page content (children) is NOT being rendered here for this specific test.
            </p>
            <p className="text-xl text-gray-800 mt-2">
              If you see this purple/orange/teal content, it means:
            </p>
            <ul className="list-disc list-inside text-gray-800 mt-2">
              <li>AuthGuard is working and rendering its children.</li>
              <li>AppLayout's basic structure (with Header) is rendering.</li>
            </ul>
            <p className="text-xl text-gray-800 mt-2">
              The original problem might be with the actual page content (e.g., DashboardPage) 
              that was passed as 'children', OR with the Sidebar components (which are currently removed).
            </p>
          </div>
          {/* Original {children} is intentionally commented out for this debug step
          <div className="mt-4 bg-gray-300 p-4">
             <p className="text-black">Original children would be here:</p>
             {children}
          </div>
          */}
        </main>
      </div>
    </AuthGuard>
  );
}
