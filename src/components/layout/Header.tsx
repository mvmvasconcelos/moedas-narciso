"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOutIcon, LeafIcon, MenuIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar"; // Assuming you have a useSidebar hook from shadcn

export function Header() {
  const { teacherName, logout } = useAuth();
  const { toggleSidebar, isMobile } = useSidebar();


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 shadow-sm">
      {isMobile && (
         <Button variant="outline" size="icon" onClick={toggleSidebar} className="md:hidden">
           <MenuIcon className="h-5 w-5" />
           <span className="sr-only">Abrir menu</span>
         </Button>
      )}
      <div className="flex items-center gap-2">
        <LeafIcon className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-semibold text-primary">Moedas Narciso</h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
        {teacherName && (
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Olá, {teacherName}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOutIcon className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
