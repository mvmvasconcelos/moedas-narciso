"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataService } from "@/lib/dataService";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { MATERIAL_TYPES, MATERIAL_LABELS } from "@/lib/constants";
import { CoinsIcon, PackageIcon, ArchiveIcon, DropletIcon, RepeatIcon, PlusCircleIcon } from "lucide-react";

interface DashboardStats {
  generalStats: {
    total_tampas: number;
    total_latas: number;
    total_oleo: number;
    total_coins: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setError(null);
        const dashboardStats = await DataService.getDashboardStats();
        
        if (!dashboardStats) {
          throw new Error("Não foi possível carregar as estatísticas");
        }
        
        setStats(dashboardStats);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
        setError(error instanceof Error ? error.message : "Erro ao carregar estatísticas");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RepeatIcon className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          <p>{error}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
          <RepeatIcon className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      
      <div>
        <p className="text-muted-foreground">
          Visão geral do sistema de trocas de materiais.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Moedas Narciso"
          value={stats.generalStats.total_coins}
          icon={CoinsIcon}
          type="coins"
        />
        <StatCard
          title="Tampas Plásticas"
          value={stats.generalStats.total_tampas}
          icon={PackageIcon}
        />
        <StatCard
          title="Latinhas"
          value={stats.generalStats.total_latas}
          icon={ArchiveIcon}
        />
        <StatCard
          title="Óleo Usado"
          value={stats.generalStats.total_oleo}
          icon={DropletIcon}
          unit="L"
        />
      </div>
      
      {/* Seção de botões para registrar trocas */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Registrar Nova Troca</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Button asChild variant="outline" className="h-auto py-6 flex flex-col space-y-2">
            <Link href={`/trocas?material=${MATERIAL_TYPES.LIDS}`}>
              <PackageIcon className="h-8 w-8 mb-2" />
              <span className="text-lg font-medium">Tampinhas</span>
              <span className="text-xs text-muted-foreground">Registrar troca de tampinhas plásticas</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-6 flex flex-col space-y-2">
            <Link href={`/trocas?material=${MATERIAL_TYPES.CANS}`}>
              <ArchiveIcon className="h-8 w-8 mb-2" />
              <span className="text-lg font-medium">Latinhas</span>
              <span className="text-xs text-muted-foreground">Registrar troca de latinhas</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-6 flex flex-col space-y-2">
            <Link href={`/trocas?material=${MATERIAL_TYPES.OIL}`}>
              <DropletIcon className="h-8 w-8 mb-2" />
              <span className="text-lg font-medium">Óleo</span>
              <span className="text-xs text-muted-foreground">Registrar troca de óleo usado</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
