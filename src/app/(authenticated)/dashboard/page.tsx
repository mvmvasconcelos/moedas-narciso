
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
            Painel de Estatísticas
          </h1>
          <p className="text-muted-foreground">
            Resumo das contribuições e Moedas Narciso distribuídas.
          </p>
        </div>
      </div>

      <div className="space-y-4"> {/* Reduced vertical spacing from space-y-6 */}
        <div className="grid grid-cols-3 gap-4"> {/* Reduced horizontal gap from gap-6 */}
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
        />
      </div>

      {/* Botões de Troca de Materiais */}
      <div className="mt-10 pt-6 border-t">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6 text-center">
          Registrar Novas Contribuições
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {materialButtons.map(({ material, label, icon: MaterialIcon }) => (
            <Button key={material} size="lg" variant="outline" className="flex-1 sm:flex-initial" asChild>
              <Link href={`/contribuicoes?material=${material}`}>
                <RepeatIcon className="mr-2 h-5 w-5" />
                <MaterialIcon className="mr-2 h-5 w-5" />
                Trocar {label.replace(" (unidades)","")}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
