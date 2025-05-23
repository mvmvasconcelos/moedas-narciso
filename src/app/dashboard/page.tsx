"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { MATERIAL_LABELS, MATERIAL_TYPES, type MaterialType } from "@/lib/constants";
import { CoinsIcon, PackageIcon, ArchiveIcon, DropletIcon, RepeatIcon, BarChart3Icon } from "lucide-react";

export default function DashboardPage() {
  return <DashboardContent />;
}

function DashboardContent() {
  const { getOverallStats, teacherName } = useAuth();
  const [stats, setStats] = useState({ totalLids: 0, totalCans: 0, totalOil: 0, totalCoins: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (teacherName !== undefined) {
      const currentStats = getOverallStats();
      setStats(currentStats);
      setIsLoading(false);
    }
  }, [getOverallStats, teacherName]);

  // Lista de materiais para os botões de troca
  const materialButtons = [
    { material: MATERIAL_TYPES.LIDS, label: MATERIAL_LABELS[MATERIAL_TYPES.LIDS], icon: PackageIcon },
    { material: MATERIAL_TYPES.CANS, label: MATERIAL_LABELS[MATERIAL_TYPES.CANS], icon: ArchiveIcon },
    { material: MATERIAL_TYPES.OIL, label: MATERIAL_LABELS[MATERIAL_TYPES.OIL], icon: DropletIcon },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex space-x-2 mt-3 md:mt-0">
          <Button asChild variant="outline" size="sm">
            <Link href="/ranking">
              <BarChart3Icon className="h-4 w-4 mr-1" />
              Ranking de Alunos
            </Link>
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard 
              title="Total de Tampinhas" 
              value={stats.totalLids} 
              icon={PackageIcon}
              description={`${MATERIAL_LABELS[MATERIAL_TYPES.LIDS]} coletadas`}
            />
            <StatCard 
              title="Total de Latinhas" 
              value={stats.totalCans} 
              icon={ArchiveIcon}
              description={`${MATERIAL_LABELS[MATERIAL_TYPES.CANS]} coletadas`}
            />
            <StatCard 
              title="Total de Óleo" 
              value={stats.totalOil} 
              icon={DropletIcon}
              description={`${MATERIAL_LABELS[MATERIAL_TYPES.OIL]} coletados`}
            />
            <StatCard 
              title="Total Moedas Narciso" 
              value={stats.totalCoins} 
              icon={CoinsIcon}
              description="Moedas Narciso geradas"
            />
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <RepeatIcon className="h-5 w-5 mr-2 text-muted-foreground" />
              Registrar Trocas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {materialButtons.map((item) => (
                <Button 
                  key={item.material} 
                  variant="outline" 
                  size="lg" 
                  className="h-auto py-6 justify-start"
                  asChild
                >
                  <Link href={`/contribuicoes?material=${item.material}`}>
                    <item.icon className="h-8 w-8 mr-4 text-primary" />
                    <div className="text-left">
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-sm text-muted-foreground">
                        Registrar troca de {item.label.toLowerCase()}
                      </div>
                    </div>
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
