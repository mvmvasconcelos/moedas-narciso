
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { CoinsIcon, PackageIcon, ArchiveIcon, DropletIcon, LayoutDashboardIcon, RepeatIcon } from "lucide-react";
import { MATERIAL_LABELS, MATERIAL_TYPES } from "@/lib/constants";
// import type { Metadata } from 'next'; // Cannot export metadata from client component

// export const metadata: Metadata = {
//   title: 'Painel de Estatísticas - Moedas Narciso',
// };

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

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <StatCard
            title={`Total de ${MATERIAL_LABELS[MATERIAL_TYPES.LIDS]}`}
            value={stats.totalLids}
            icon={PackageIcon}
            isLoading={isLoading}
          />
          <StatCard
            title={`Total de ${MATERIAL_LABELS[MATERIAL_TYPES.CANS]}`}
            value={stats.totalCans}
            icon={ArchiveIcon}
            isLoading={isLoading}
          />
          <StatCard
            title={`Total de ${MATERIAL_LABELS[MATERIAL_TYPES.OIL]} (unidades)`}
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
          Trocar Materiais por Prêmios
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="outline" className="flex-1 sm:flex-initial">
            <RepeatIcon className="mr-2 h-5 w-5" />
            <PackageIcon className="mr-2 h-5 w-5" />
            Trocar {MATERIAL_LABELS[MATERIAL_TYPES.LIDS]}
          </Button>
          <Button size="lg" variant="outline" className="flex-1 sm:flex-initial">
            <RepeatIcon className="mr-2 h-5 w-5" />
            <ArchiveIcon className="mr-2 h-5 w-5" />
            Trocar {MATERIAL_LABELS[MATERIAL_TYPES.CANS]}
          </Button>
          <Button size="lg" variant="outline" className="flex-1 sm:flex-initial">
            <RepeatIcon className="mr-2 h-5 w-5" />
            <DropletIcon className="mr-2 h-5 w-5" />
            Trocar {MATERIAL_LABELS[MATERIAL_TYPES.OIL]}
          </Button>
        </div>
      </div>
    </div>
  );
}
