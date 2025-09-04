"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataService } from "@/lib/dataService";
import { useAuth } from "@/hooks/use-auth";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { CoinsIcon, PackageIcon, ArchiveIcon, DropletIcon, RepeatIcon, BarChart3Icon, UsersIcon } from "lucide-react";
import { SupabaseConnectionTest } from "@/components/auth/SupabaseConnectionTest";

interface DashboardStats {
  generalStats: {
    total_students: number;
    total_classes: number;
    total_tampas: number;
    total_latas: number;
    total_oleo: number;
    total_coins: number;
  };
  currentPeriod: any;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const dashboardStats = await DataService.getDashboardStats();
        console.log("Dashboard stats:", dashboardStats); // Debug log
        setStats(dashboardStats);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RepeatIcon className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex space-x-2 mt-3 md:mt-0">
          <Button asChild variant="outline" size="sm">
            <Link href="/ranking">
              <BarChart3Icon className="h-4 w-4 mr-1" />
              Ranking de Alunos
            </Link>
          </Button>
        </div>
      </div>
      
      <div>
        <p className="text-muted-foreground">
          Visão geral do sistema de trocas de materiais.
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total de Alunos"
          value={stats.generalStats.total_students}
          icon={UsersIcon}
        />
        <StatCard
          title="Moedas Narciso"
          value={stats.generalStats.total_coins}
          icon={CoinsIcon}
          type="coins"
        />
        <StatCard
          title="Total de Turmas"
          value={stats.generalStats.total_classes}
          icon={UsersIcon}
        />
        <StatCard
          title="Total de Materiais"
          value={
            stats.generalStats.total_tampas +
            stats.generalStats.total_latas +
            stats.generalStats.total_oleo
          }
          icon={PackageIcon}
        />
      </div>

      {/* Detalhamento por Material */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard
          title="Tampinhas"
          value={stats.generalStats.total_tampas}
          icon={PackageIcon}
          type="lids"
        />
        <StatCard
          title="Latinhas"
          value={stats.generalStats.total_latas}
          icon={ArchiveIcon}
          type="cans"
        />
        <StatCard
          title="Óleo"
          value={stats.generalStats.total_oleo}
          icon={DropletIcon}
          type="oil"
          unit="L"
        />
      </div>

      {/* Seção de Diagnóstico do Supabase */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Diagnóstico do Sistema</h3>
        <SupabaseConnectionTest />
      </div>
    </div>
  );
}
