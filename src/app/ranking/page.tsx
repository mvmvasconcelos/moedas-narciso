"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { Student, Class, MaterialType, GenderType } from "@/lib/constants";
import { MATERIAL_TYPES, MATERIAL_LABELS } from "@/lib/constants";
import { StudentRankCard } from "@/components/ranking/StudentRankCard";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3Icon, CoinsIcon, PackageIcon, ArchiveIcon, DropletIcon, UsersIcon, TrophyIcon, AwardIcon, FilterIcon, type LucideIcon } from "lucide-react"; 
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type SortCriterion = MaterialType | 'narcisoCoins';

export default function RankingPage() {
  return <RankingContent />;
}

function RankingContent() {
  const { students, classes, teacherName } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classSortCriterion, setClassSortCriterion] = useState<SortCriterion>('narcisoCoins');

  // Ordenar classes para garantir que Prés apareçam primeiro, seguido pelos anos em ordem numérica
  const sortedClasses = useMemo(() => {
    if (!classes || classes.length === 0) return [];
    
    return [...classes].sort((a, b) => {
      // Função para extrair o "peso" de ordenação de uma turma
      const getOrderWeight = (className: string): number => {
        const nameLower = className.toLowerCase();
        
        // Os Prés têm prioridade máxima
        if (nameLower.includes('pré')) {
          return nameLower.includes('manhã') ? 1 : 2; // Pré Manhã vem antes de Pré Tarde
        }
        
        // Extrair o número do ano (1º, 2º, etc.)
        const yearMatch = className.match(/(\d+)º/);
        if (yearMatch && yearMatch[1]) {
          return 10 + parseInt(yearMatch[1], 10); // 1º ano = 11, 2º ano = 12, etc.
        }
        
        // Se não conseguir determinar, coloca no final
        return 100;
      };
      
      return getOrderWeight(a.name) - getOrderWeight(b.name);
    });
  }, [classes]);

  useEffect(() => {
    if (teacherName !== undefined && students.length > 0) {
        setIsLoading(false);
    } else if (teacherName !== undefined && students.length === 0){
        // Se não há alunos, mas o professor está carregado, paramos de carregar
        setIsLoading(false);
    }
  }, [teacherName, students]);


  const sortedByCoins = useMemo(() => {
    return [...students].sort((a, b) => b.narcisoCoins - a.narcisoCoins);
  }, [students]);

  const topCoinStudent = useMemo(() => sortedByCoins[0], [sortedByCoins]);
  const nextFourCoinStudents = useMemo(() => sortedByCoins.slice(1, 5), [sortedByCoins]);

  const getTopCoinStudentTitle = (student: Student | undefined | null): string => {
    if (!student) return "#1 - Campeão(ã) de Moedas";
    if (student.gender === 'masculino') return "#1 - Campeão de Moedas";
    if (student.gender === 'feminino') return "#1 - Campeã de Moedas";
    return "#1 - Campeão(ã) de Moedas";
  };

  const findTopContributor = (material: MaterialType): Student | null => {
    if (students.length === 0) return null;
    return [...students].sort((a, b) => (b.exchanges?.[material] || 0) - (a.exchanges?.[material] || 0))[0];
  };

  const topLidsContributor = useMemo(() => findTopContributor(MATERIAL_TYPES.LIDS), [students]);
  const topCansContributor = useMemo(() => findTopContributor(MATERIAL_TYPES.CANS), [students]);
  const topOilContributor = useMemo(() => findTopContributor(MATERIAL_TYPES.OIL), [students]);

  const getMaterialTitle = (material: MaterialType, gender: GenderType | undefined): string => {
    const defaultTitles: Record<MaterialType, string> = {
        [MATERIAL_TYPES.LIDS]: "Destaque em Tampas",
        [MATERIAL_TYPES.CANS]: "Destaque em Latas",
        [MATERIAL_TYPES.OIL]: "Destaque em Óleo",
    };
    if (!gender) return defaultTitles[material];

    switch (material) {
        case MATERIAL_TYPES.LIDS:
            return gender === 'masculino' ? "Rei das Tampas" : gender === 'feminino' ? "Rainha das Tampas" : defaultTitles[material];
        case MATERIAL_TYPES.CANS:
            return gender === 'masculino' ? "Mestre das Latas" : gender === 'feminino' ? "Mestra das Latas" : defaultTitles[material];
        case MATERIAL_TYPES.OIL:
            return gender === 'masculino' ? "Barão do Óleo" : gender === 'feminino' ? "Baronesa do Óleo" : defaultTitles[material];
        default:
            return defaultTitles[material];
    }
  };


  const rankedStudentsInClass = useMemo(() => {
    if (!selectedClass) return [];
    const classStudents = students.filter(s => s.className === selectedClass.name);
    return classStudents.sort((a, b) => {
      if (classSortCriterion === 'narcisoCoins') {
        return (b.narcisoCoins || 0) - (a.narcisoCoins || 0);
      }
      return (b.exchanges?.[classSortCriterion] || 0) - (a.exchanges?.[classSortCriterion] || 0);
    });
  }, [students, selectedClass, classSortCriterion]);

  const handleClassSelect = (cls: Class) => {
    setSelectedClass(prev => (prev?.id === cls.id ? null : cls));
    setClassSortCriterion('narcisoCoins'); 
  };
  
  const getCriterionValue = (student: Student, criterion: SortCriterion) => {
    if (criterion === 'narcisoCoins') return student.narcisoCoins || 0;
    return student.exchanges?.[criterion] || 0;
  };

  const getCriterionLabel = (criterion: SortCriterion) => {
    if (criterion === 'narcisoCoins') return "Moedas";
    return MATERIAL_LABELS[criterion].replace(" (unidades)", "");
  };
  
  const getCriterionIcon = (criterion: SortCriterion): LucideIcon => {
    if (criterion === 'narcisoCoins') return CoinsIcon;
    if (criterion === MATERIAL_TYPES.LIDS) return PackageIcon;
    if (criterion === MATERIAL_TYPES.CANS) return ArchiveIcon;
    if (criterion === MATERIAL_TYPES.OIL) return DropletIcon;
    return FilterIcon; 
  };


  const filterCriteria: { label: string; value: SortCriterion; icon: LucideIcon }[] = [
    { label: "Moedas", value: "narcisoCoins", icon: CoinsIcon },
    { label: MATERIAL_LABELS[MATERIAL_TYPES.LIDS].replace(" (unidades)",""), value: MATERIAL_TYPES.LIDS, icon: PackageIcon },
    { label: MATERIAL_LABELS[MATERIAL_TYPES.CANS].replace(" (unidades)",""), value: MATERIAL_TYPES.CANS, icon: ArchiveIcon },
    { label: MATERIAL_LABELS[MATERIAL_TYPES.OIL].replace(" (unidades)",""), value: MATERIAL_TYPES.OIL, icon: DropletIcon },
  ];


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <BarChart3Icon className="mr-3 h-8 w-8 text-primary" />
            Ranking Geral
          </h1>
          <p className="text-muted-foreground">
            Destaques de trocas e Moedas Narciso.
          </p>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground flex items-center">
          <TrophyIcon className="mr-2 h-6 w-6 text-amber-500" />
          Top Alunos por Moedas Narciso
        </h2>
        {topCoinStudent ? (
          <StudentRankCard
            student={topCoinStudent}
            title={getTopCoinStudentTitle(topCoinStudent)}
            value={`${topCoinStudent.narcisoCoins} Moedas`}
            icon={CoinsIcon}
            variant="prominent"
            isLoading={isLoading}
            avatarSeed={topCoinStudent.name}
          />
        ) : (
           <StudentRankCard
            student={null}
            title={getTopCoinStudentTitle(null)}
            value={"N/A"}
            icon={CoinsIcon}
            variant="prominent"
            isLoading={isLoading}
          />
        )}
        {nextFourCoinStudents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {nextFourCoinStudents.map((student, index) => (
              <StudentRankCard
                key={student.id}
                student={student}
                title={`#${index + 2} em Moedas`}
                value={`${student.narcisoCoins} Moedas`}
                icon={CoinsIcon}
                variant="default"
                isLoading={isLoading}
                avatarSeed={student.name}
              />
            ))}
          </div>
        )}
      </section>

      <Separator className="my-8" />

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground flex items-center">
          <AwardIcon className="mr-2 h-6 w-6 text-sky-500" />
          Maiores Trocadores por Material
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StudentRankCard
            student={topLidsContributor}
            title={getMaterialTitle(MATERIAL_TYPES.LIDS, topLidsContributor?.gender)}
            value={`${topLidsContributor?.exchanges?.[MATERIAL_TYPES.LIDS] || 0} ${MATERIAL_LABELS[MATERIAL_TYPES.LIDS].replace(" (unidades)","")}`}
            icon={PackageIcon}
            variant="default"
            isLoading={isLoading}
            avatarSeed={topLidsContributor?.name}
          />
          <StudentRankCard
            student={topCansContributor}
            title={getMaterialTitle(MATERIAL_TYPES.CANS, topCansContributor?.gender)}
            value={`${topCansContributor?.exchanges?.[MATERIAL_TYPES.CANS] || 0} ${MATERIAL_LABELS[MATERIAL_TYPES.CANS].replace(" (unidades)","")}`}
            icon={ArchiveIcon}
            variant="default"
            isLoading={isLoading}
            avatarSeed={topCansContributor?.name}
          />
          <StudentRankCard
            student={topOilContributor}
            title={getMaterialTitle(MATERIAL_TYPES.OIL, topOilContributor?.gender)}
            value={`${topOilContributor?.exchanges?.[MATERIAL_TYPES.OIL] || 0} ${MATERIAL_LABELS[MATERIAL_TYPES.OIL].replace(" (unidades)","")}`}
            icon={DropletIcon}
            variant="default"
            isLoading={isLoading}
            avatarSeed={topOilContributor?.name}
          />
        </div>
      </section>

      <Separator className="my-8" />

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground flex items-center">
          <UsersIcon className="mr-2 h-6 w-6 text-emerald-500" />
          Ranking por Turma
        </h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {sortedClasses.map((cls) => (
            <Button
              key={cls.id}
              variant={selectedClass?.id === cls.id ? "default" : "outline"}
              onClick={() => handleClassSelect(cls)}
              className={cn(
                selectedClass?.id === cls.id && "bg-primary text-primary-foreground"
              )}
            >
              {cls.name}
            </Button>
          ))}
        </div>
        
        {selectedClass && (
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Turma {selectedClass.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2 mb-4">
                {filterCriteria.map((criterion) => (
                  <Button
                    key={criterion.value}
                    variant={classSortCriterion === criterion.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setClassSortCriterion(criterion.value)}
                    className={cn(
                      "min-w-24",
                      classSortCriterion === criterion.value && "bg-primary text-primary-foreground"
                    )}
                  >
                    <criterion.icon className="h-4 w-4 mr-1" />
                    {criterion.label}
                  </Button>
                ))}
              </div>

              {rankedStudentsInClass.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Não há alunos cadastrados nesta turma.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left pl-4 py-2">#</th>
                      <th className="text-left py-2">Aluno</th>
                      <th className="text-right py-2 pr-4">
                        <div className="flex items-center justify-end gap-1">
                          {getCriterionLabel(classSortCriterion)}
                          {(() => {
                            const IconComponent = getCriterionIcon(classSortCriterion);
                            return <IconComponent className="h-4 w-4" />;
                          })()}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedStudentsInClass.map((student, index) => (
                      <tr 
                        key={student.id} 
                        className={cn(
                          "border-t", 
                          index === 0 && "border-t-primary bg-primary/5",
                          index === 1 && "border-t-gray-300 bg-gray-50",
                          index === 2 && "border-t-amber-200 bg-amber-50"
                        )}
                      >
                        <td className="pl-4 py-2 text-sm">
                          <span 
                            className={cn(
                              "inline-block w-6 h-6 rounded-full text-center leading-6",
                              index === 0 && "bg-primary text-white font-medium",
                              index === 1 && "bg-gray-200",
                              index === 2 && "bg-amber-200",
                              index > 2 && "text-muted-foreground"
                            )}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-2">{student.name}</td>
                        <td className="text-right py-2 pr-4 font-medium">
                          {getCriterionValue(student, classSortCriterion)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
