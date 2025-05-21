
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { CoinsIcon, PackageIcon, ArchiveIcon, DropletIcon, LayoutDashboardIcon, RepeatIcon, type LucideIcon } from "lucide-react";
import { MATERIAL_LABELS, MATERIAL_TYPES, type MaterialType } from "@/lib/constants";

export default function DashboardPage() {
  console.log("DEBUG: /src/app/(authenticated)/dashboard/page.tsx - DashboardPage FUNCTION CALLED (Restoring Content)");
  const { getOverallStats, teacherName } = useAuth();
  const [stats, setStats] = useState({ totalLids: 0, totalCans: 0, totalOil: 0, totalCoins: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (teacherName !== undefined) { // Ensure auth state is resolved
        const currentStats = getOverallStats();
        setStats(currentStats);
        setIsLoading(false);
    }
  }, [getOverallStats, teacherName]);


  const materialButtons: { material: MaterialType, label: string, icon: LucideIcon }[] = [
    { material: MATERIAL_TYPES.LIDS, label: MATERIAL_LABELS[MATERIAL_TYPES.LIDS], icon: PackageIcon },
    { material: MATERIAL_TYPES.CANS, label: MATERIAL_LABELS[MATERIAL_TYPES.CANS], icon: ArchiveIcon },
    { material: MATERIAL_TYPES.OIL, label: MATERIAL_LABELS[MATERIAL_TYPES.OIL], icon: DropletIcon },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <LayoutDashboardIcon className="mr-3 h-8 w-8 text-primary" />
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Resumo das contribuições e Moedas Narciso distribuídas.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            title="Tampas"
            value={stats.totalLids}
            icon={PackageIcon}
            isLoading={isLoading}
          />
          <StatCard
            title="Latas"
            value={stats.totalCans}
            icon={ArchiveIcon}
            isLoading={isLoading}
          />
          <StatCard
            title="Óleo"
            value={stats.totalOil}
            icon={DropletIcon}
            isLoading={isLoading}
          />
        </div>
        <StatCard
          title="Total de Moedas Narciso"
          value={stats.totalCoins}
          icon={CoinsIcon}
          isLoading={isLoading}
          className="w-full"
        />
      </div>

      {/* Botões de Troca de Materiais */}
      <div className="mt-10 pt-6 border-t">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6 text-center">
          Registrar Novas Contribuições
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {materialButtons.map(({ material, label, icon: MaterialIcon }) => (
            <Button
              key={material}
              variant="outline"
              className="flex-1 sm:flex-initial h-32 p-0" // Increased height, removed size prop, p-0
              asChild
            >
              <Link
                href={`/contribuicoes?material=${material}`}
                className="flex flex-col items-center justify-center h-full w-full text-center p-2" // Flex column, center, padding
              >
                <div className="flex items-center mb-2"> {/* Group icons */}
                  <RepeatIcon className="h-7 w-7" /> {/* Slightly larger icons */}
                  <MaterialIcon className="ml-2 h-7 w-7" />
                </div>
                <span className="text-base">Trocar {label.replace(" (unidades)","")}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
