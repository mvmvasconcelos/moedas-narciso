
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon, UsersIcon, ClipboardPlusIcon, LeafIcon, LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth"; // Import useAuth

const navItems = [
  { href: "/dashboard", label: "Painel de Estatísticas", icon: LayoutDashboardIcon },
  { href: "/alunos", label: "Gerenciar Alunos", icon: UsersIcon },
  { href: "/contribuicoes", label: "Registrar Contribuições", icon: ClipboardPlusIcon },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { logout, teacherName } = useAuth(); // Get logout function and teacherName

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 p-2">
            <LeafIcon className="h-8 w-8 text-sidebar-primary-foreground" />
            <h2 className="text-lg font-semibold text-sidebar-primary-foreground group-data-[collapsible=icon]:hidden">
            Moedas Narciso
            </h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon;
            // Adjust isActive for /dashboard route as it's the new root for authenticated users
            const isActive = (item.href === "/dashboard" && (pathname === "/dashboard" || pathname === "/")) || (item.href !== "/dashboard" && pathname === item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={{children: item.label, side: 'right', align: 'center' }}
                    className={cn(
                        "justify-start",
                        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <a>
                      <Icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t p-2 flex flex-col gap-2"> {/* Added flex flex-col gap-2 */}
        {teacherName && (
           <div className="px-2 py-1 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden truncate">
             Olá, {teacherName}
           </div>
        )}
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={logout}
            tooltip={{children: "Sair", side: 'right', align: 'center' }}
            className="justify-start w-full" // Ensure button takes full width
          >
            <LogOutIcon className="h-5 w-5" />
            <span className="group-data-[collapsible=icon]:hidden">Sair</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarGroupLabel className="text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            © {new Date().getFullYear()} Moedas Narciso
        </SidebarGroupLabel>
      </SidebarFooter>
    </>
  );
}
