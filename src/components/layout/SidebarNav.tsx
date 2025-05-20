"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon, UsersIcon, ClipboardPlusIcon, LeafIcon } from "lucide-react";
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

const navItems = [
  { href: "/", label: "Painel de Estatísticas", icon: LayoutDashboardIcon },
  { href: "/alunos", label: "Gerenciar Alunos", icon: UsersIcon },
  { href: "/contribuicoes", label: "Registrar Contribuições", icon: ClipboardPlusIcon },
];

export function SidebarNav() {
  const pathname = usePathname();

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
            const isActive = pathname === item.href;
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
      <SidebarFooter className="mt-auto border-t p-2">
        <SidebarGroupLabel className="text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            © {new Date().getFullYear()} Moedas Narciso
        </SidebarGroupLabel>
      </SidebarFooter>
    </>
  );
}
