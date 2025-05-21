
"use client";

import { Button } from "@/components/ui/button";
import { LeafIcon, MenuIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
// Removed useAuth and LogOutIcon imports as they are no longer used here

export function Header() {
  const { toggleSidebar } = useSidebar(); 
  // Removed teacherName and logout from useAuth() as they are no longer used here

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 shadow-sm">
      {/* Button to toggle sidebar, now always visible */}
      <Button variant="outline" size="icon" onClick={toggleSidebar}>
        <MenuIcon className="h-5 w-5" />
        <span className="sr-only">Abrir/Fechar menu</span>
      </Button>
      <div className="flex items-center gap-2">
        <LeafIcon className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-semibold text-primary">Moedas Narciso</h1>
      </div>
      {/* Removed the div containing teacher greeting and logout button */}
    </header>
  );
}
