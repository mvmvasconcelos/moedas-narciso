
"use client";

import { StatCard } from "@/components/dashboard/StatCard";
import { useAuth } from "@/hooks/use-auth";
import { CoinsIcon, PackageIcon, ArchiveIcon, DropletIcon } from "lucide-react";
import { MATERIAL_TYPES } from "@/lib/constants";
import { useEffect, useState } from "react";
import type { Metadata } from 'next';

// Cannot export metadata from client component.
// export const metadata: Metadata = {
//   title: 'Painel - Moedas Narciso',
// };


interface Stats {
  totalLids: number;
  totalCans: number;
  totalOil: number;
  totalCoins: number;
}

export default function DashboardPage() {
  console.log("DashboardPage rendering");
  const { teacherName, getOverallStats } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("DashboardPage: useEffect for stats triggered", { teacherName });
    if (teacherName) { // Ensure auth context is loaded
        const currentStats = getOverallStats();
        setStats(currentStats);
        setIsLoading(false);
        console.log("DashboardPage: Stats loaded", currentStats);
    } else {
        console.log("DashboardPage: teacherName not available yet for stats");
    }
  }, [teacherName, getOverallStats]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Painel de Estatísticas
        </h1>
        {teacherName && (
          <p className="text-muted-foreground">
            Olá, {teacherName}! Aqui está um resumo das atividades.
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Tampas Coletadas"
          value={stats?.totalLids ?? 0}
          icon={PackageIcon}
          isLoading={isLoading}
        />
        <StatCard
          title="Total de Latas Coletadas"
          value={stats?.totalCans ?? 0}
          icon={ArchiveIcon}
          isLoading={isLoading}
        />
        <StatCard
          title="Total de Óleo Coletado (unidades)"
          value={stats?.totalOil ?? 0}
          icon={DropletIcon}
          isLoading={isLoading}
        />
        <StatCard
          title="Total de Moedas Narciso Distribuídas"
          value={stats?.totalCoins ?? 0}
          icon={CoinsIcon}
          isLoading={isLoading}
        />
      </div>
      
      {/* Placeholder for potential charts or more detailed stats */}
      {/* <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Progresso da Coleta</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Gráficos de progresso em breve.</p>
           For charts, use <ChartContainer> from shadcn/ui/chart 
        </CardContent>
      </Card> */}
    </div>
  );
}
