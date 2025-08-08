"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon, UsersIcon, LeafIcon, LogOutIcon, BarChart3Icon, HistoryIcon, ShoppingCartIcon } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/components/ui/sidebar"; // Import useSidebar

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/alunos", label: "Gerenciar Alunos", icon: UsersIcon },
  { href: "/ranking", label: "Ranking", icon: BarChart3Icon },
  { href: "/trocas", label: "Registrar Trocas", icon: LeafIcon },
  { href: "/lojinha", label: "Lojinha", icon: ShoppingCartIcon },
  { href: "/historico", label: "Histórico de Trocas", icon: HistoryIcon },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { logout, teacherName } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar(); // Get sidebar control functions

  const handleMenuItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

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
          {navItems.map((item) => {            const Icon = item.icon;            // Lógica ajustada para destacar corretamente os itens de menu ativos
            const isActive = 
              (item.href === "/dashboard" && pathname === "/dashboard") ||
              (item.href === "/trocas" && pathname.startsWith("/trocas")) ||
              (item.href === "/historico" && pathname.startsWith("/historico")) ||
              (item.href !== "/dashboard" && item.href !== "/trocas" && item.href !== "/historico" && pathname.startsWith(item.href));

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
                    onClick={handleMenuItemClick} // Add onClick handler here
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
      <SidebarFooter className="mt-auto border-t p-2 flex flex-col gap-2">
        {teacherName && (
           <div className="px-2 py-1 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden truncate">
             Olá, {teacherName}
           </div>
        )}
        <SidebarMenuItem className="list-none">
          <SidebarMenuButton
            onClick={() => {
              logout();
              handleMenuItemClick(); // Also close sidebar on logout if mobile
            }}
            tooltip={{children: "Sair", side: 'right', align: 'center' }}
            className="justify-start w-full"
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
