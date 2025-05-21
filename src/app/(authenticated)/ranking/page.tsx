
"use client";

import { useState, useMemo, useEffect } from "react"; // Adicionado useEffect
import { useAuth } from "@/hooks/use-auth";
import type { Student, Class, MaterialType, GenderType } from "@/lib/constants";
import { MATERIAL_TYPES, MATERIAL_LABELS } from "@/lib/constants";
import { StudentRankCard } from "@/components/ranking/StudentRankCard";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3Icon, CoinsIcon, PackageIcon, ArchiveIcon, DropletIcon, UsersIcon, TrophyIcon, AwardIcon, FilterIcon, LucideIcon } from "lucide-react"; // type LucideIcon importado
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type SortCriterion = MaterialType | 'narcisoCoins';

export default function RankingPage() {
  const { students, classes, teacherName } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classSortCriterion, setClassSortCriterion] = useState<SortCriterion>('narcisoCoins');

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

  const findTopContributor = (material: MaterialType): Student | null => {
    if (students.length === 0) return null;
    return [...students].sort((a, b) => (b.contributions[material] || 0) - (a.contributions[material] || 0))[0];
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
      return (b.contributions[classSortCriterion] || 0) - (a.contributions[classSortCriterion] || 0);
    });
  }, [students, selectedClass, classSortCriterion]);

  const handleClassSelect = (cls: Class) => {
    setSelectedClass(prev => (prev?.id === cls.id ? null : cls));
    setClassSortCriterion('narcisoCoins'); 
  };
  
  const getCriterionValue = (student: Student, criterion: SortCriterion) => {
    if (criterion === 'narcisoCoins') return student.narcisoCoins || 0;
    return student.contributions[criterion] || 0;
  };

  const getCriterionLabel = (criterion: SortCriterion) => {
    if (criterion === 'narcisoCoins') return "Moedas";
    return MATERIAL_LABELS[criterion].replace(" (unidades)", "");
  };
  
  const getCriterionIcon = (criterion: SortCriterion) => {
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
            Destaques de contribuições e Moedas Narciso.
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
            title="#1 - Campeão(ã) de Moedas"
            value={`${topCoinStudent.narcisoCoins} Moedas`}
            icon={CoinsIcon}
            variant="prominent"
            isLoading={isLoading}
            avatarSeed={topCoinStudent.name}
          />
        ) : (
           <StudentRankCard
            student={null}
            title="#1 - Campeão(ã) de Moedas"
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
          Maiores Contribuidores por Material
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StudentRankCard
            student={topLidsContributor}
            title={getMaterialTitle(MATERIAL_TYPES.LIDS, topLidsContributor?.gender)}
            value={`${topLidsContributor?.contributions[MATERIAL_TYPES.LIDS] || 0} ${MATERIAL_LABELS[MATERIAL_TYPES.LIDS].replace(" (unidades)","")}`}
            icon={PackageIcon}
            variant="default"
            isLoading={isLoading}
            avatarSeed={topLidsContributor?.name}
          />
          <StudentRankCard
            student={topCansContributor}
            title={getMaterialTitle(MATERIAL_TYPES.CANS, topCansContributor?.gender)}
            value={`${topCansContributor?.contributions[MATERIAL_TYPES.CANS] || 0} ${MATERIAL_LABELS[MATERIAL_TYPES.CANS].replace(" (unidades)","")}`}
            icon={ArchiveIcon}
            variant="default"
            isLoading={isLoading}
            avatarSeed={topCansContributor?.name}
          />
          <StudentRankCard
            student={topOilContributor}
            title={getMaterialTitle(MATERIAL_TYPES.OIL, topOilContributor?.gender)}
            value={`${topOilContributor?.contributions[MATERIAL_TYPES.OIL] || 0} ${MATERIAL_LABELS[MATERIAL_TYPES.OIL].replace(" (unidades)","")}`}
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
          <UsersIcon className="mr-2 h-6 w-6 text-teal-500" />
          Ranking por Turma
        </h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Selecione uma Turma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
                "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 transition-all duration-500 ease-in-out",
                 selectedClass ? "opacity-0 max-h-0 invisible" : "opacity-100 max-h-[500px] visible mb-4"
            )}>
              {classes.map((cls) => (
                <Button
                  key={cls.id}
                  variant={selectedClass?.id === cls.id ? "default" : "outline"}
                  onClick={() => handleClassSelect(cls)}
                  className="w-full h-auto py-2 px-1.5 flex flex-col items-center whitespace-normal text-center leading-snug hover:bg-primary hover:text-primary-foreground"
                >
                  <UsersIcon className="h-4 w-4 mb-1 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{cls.name}</span>
                </Button>
              ))}
            </div>
            <div className={cn(
                "flex justify-center transition-all duration-500 ease-in-out",
                selectedClass ? "opacity-100 max-h-40 visible mb-4" : "opacity-0 max-h-0 invisible"
            )}>
                {selectedClass && (
                    <Button
                        variant="destructive"
                        onClick={() => handleClassSelect(selectedClass)} // Permite deselecionar
                        className="w-full max-w-xs sm:max-w-sm h-auto py-3 px-4 flex flex-col items-center whitespace-normal text-center leading-snug"
                    >
                        <UsersIcon className="h-5 w-5 mb-1 flex-shrink-0" />
                        <span className="text-sm">{selectedClass.name}</span>
                    </Button>
                )}
            </div>

            {selectedClass && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 text-center">Filtrar Ranking da Turma por:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {filterCriteria.map(crit => {
                    const FilterCritIcon = crit.icon;
                    return (
                      <Button
                        key={crit.value}
                        variant={classSortCriterion === crit.value ? "default" : "outline"}
                        onClick={() => setClassSortCriterion(crit.value)}
                        size="sm"
                        className="flex-1"
                      >
                        <FilterCritIcon className="mr-1.5 h-4 w-4" />
                        {crit.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedClass && (
          <div className="mt-6 space-y-3">
            {rankedStudentsInClass.length > 0 ? (
              rankedStudentsInClass.map((student, index) => (
                <StudentRankCard
                  key={student.id}
                  student={student}
                  title={`#${index + 1} em ${getCriterionLabel(classSortCriterion)} na turma`}
                  value={`${getCriterionValue(student, classSortCriterion)} ${getCriterionLabel(classSortCriterion)}`}
                  icon={getCriterionIcon(classSortCriterion)}
                  variant="small"
                  isLoading={isLoading}
                  avatarSeed={student.name}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground">Nenhum aluno para exibir nesta turma ou critério.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
