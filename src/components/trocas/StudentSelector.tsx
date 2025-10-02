"use client";

import { Button } from "@/components/ui/button";
import type { Student, Class, MaterialType } from "@/lib/constants";
import { MATERIAL_TYPES, MATERIAL_LABELS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { UsersIcon, PackageIcon, ArchiveIcon, DropletIcon } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StudentPhoto } from "@/components/alunos/StudentPhoto";

interface StudentSelectorProps {
  onStudentSelect: (student: Student) => void;
  selectedStudent?: Student | null;
  onMaterialSelect?: (materialType: MaterialType) => void;
}

export function StudentSelector({ 
  onStudentSelect, 
  selectedStudent = null,
  onMaterialSelect
}: StudentSelectorProps) {
  const { classes, students } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [internalSelectedStudent, setInternalSelectedStudent] = useState<Student | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  // Sincronizar selectedStudent com selectedStudent prop (para resetar quando necessário)
  useEffect(() => {
    if (selectedStudent === null && internalSelectedStudent !== null) {
      setInternalSelectedStudent(null);
    }
  }, [selectedStudent, internalSelectedStudent]);

  // Fallback: extrair turmas dos alunos se classes estiver vazio (problema RLS)
  const classesFromStudents = useMemo(() => {
    if (classes && classes.length > 0) return [];
    
    const uniqueClassNames = [...new Set(students.map(s => s.className))];
    return uniqueClassNames.map((name, index) => ({
      id: `fallback-${index}`,
      name: name
    }));
  }, [classes, students]);

  /**
   * Ordena as turmas para garantir uma ordem pedagógica consistente:
   * 1. Turmas de "Pré" aparecem primeiro (Pré Manhã, depois Pré Tarde)
   * 2. Anos são ordenados numericamente (1º ano, 2º ano, etc.)
   * 3. Turmas sem padrão reconhecido ficam por último
   */
  const sortedClasses = useMemo(() => {
    const classesToUse = (classes && classes.length > 0) ? classes : classesFromStudents;
    if (!classesToUse || classesToUse.length === 0) return [];
    
    return [...classesToUse].sort((a, b) => {
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

  // Filtrar alunos quando a turma muda
  useEffect(() => {
    if (selectedClass) {
      // Verificar quais alunos têm essa classe
      const matchingStudents = students.filter(s => s.className === selectedClass);
      
      if (matchingStudents.length === 0) {
        // Se não encontrar alunos com o nome exato, buscar por correspondência parcial
        const studentsWithSimilarClass = students.filter(
          s => s.className && s.className.includes(selectedClass) || 
               selectedClass.includes(s.className)
        );
        
        // Se encontrar alunos com correspondência parcial, usá-los
        if (studentsWithSimilarClass.length > 0) {
          setFilteredStudents(studentsWithSimilarClass);
        } else {
          setFilteredStudents([]);
        }
      } else {
        // Se encontrar alunos com correspondência exata, usá-los
        setFilteredStudents(matchingStudents);
      }
    } else {
      setFilteredStudents([]);
    }
  }, [selectedClass, students]);

  function handleClassSelect(className: string) {
    if (selectedClass === className) { 
      setSelectedClass(null);
    } else { 
      setSelectedClass(className);
    }
  }

  function handleStudentSelect(student: Student) {
    if (internalSelectedStudent?.id === student.id) {
      // Se clicar no mesmo aluno, deseleciona
      setInternalSelectedStudent(null);
    } else {
      // Seleciona novo aluno
      setInternalSelectedStudent(student);
      onStudentSelect(student);
    }
  }

  function handleMaterialSelect(materialType: MaterialType) {
    if (onMaterialSelect) {
      onMaterialSelect(materialType);
    }
  }

  return (
    <Card className="w-full shadow-xl">
      <CardContent className="space-y-6 pt-6">
        {/* Seleção de Turma */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {internalSelectedStudent ? `Material - ${internalSelectedStudent.name}` : 
               selectedClass ? `Alunos da turma ${selectedClass}` : 
               'Selecione a Turma'}
            </h3>
          </div>
          
          {/* Grid de todas as turmas (visível se NENHUMA turma selecionada) */}
          <div
            className={cn(
              "grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1 transition-all duration-500 ease-in-out overflow-hidden",
              selectedClass ? "opacity-0 max-h-0 invisible" : "opacity-100 max-h-[500px] visible"
            )}
          >
            {sortedClasses.map((cls) => (
              <Button
                key={cls.id}
                type="button"
                variant={"outline"}
                onClick={() => handleClassSelect(cls.name)}
                className={cn(
                  "w-full h-auto py-2 px-1.5 flex flex-col items-center whitespace-normal text-center leading-snug",
                   "hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 mb-1 flex-shrink-0" />
                <span className="text-xs sm:text-sm">{cls.name}</span>
              </Button>
            ))}
          </div>

          {/* Botão da turma selecionada (visível se turma selecionada mas aluno NÃO) */}
          <div
            className={cn(
              "flex justify-center mt-1 transition-all duration-500 ease-in-out overflow-hidden",
              selectedClass && !internalSelectedStudent ? "opacity-100 max-h-40 visible" : "opacity-0 max-h-0 invisible"
            )}
          >
            {selectedClass && !internalSelectedStudent && sortedClasses.find(cls => cls.name === selectedClass) && (
              <Button
                key={sortedClasses.find(cls => cls.name === selectedClass)!.id} 
                type="button"
                variant="destructive"
                onClick={() => handleClassSelect(selectedClass)} 
                className={cn(
                  "w-full max-w-xs sm:max-w-sm h-auto py-3 px-4 flex flex-col items-center whitespace-normal text-center leading-snug"
                )}
              >
                <UsersIcon className="h-5 w-5 mb-1 flex-shrink-0" />
                <span className="text-sm">{selectedClass}</span>
              </Button>
            )}
          </div>

          {/* Botão do aluno selecionado (visível se aluno ESTÁ selecionado) */}
          <div
            className={cn(
              "flex justify-center mt-1 transition-all duration-500 ease-in-out overflow-hidden",
              internalSelectedStudent ? "opacity-100 max-h-40 visible" : "opacity-0 max-h-0 invisible"
            )}
          >
            {internalSelectedStudent && (
              <Button
                key={internalSelectedStudent.id}
                type="button"
                variant="destructive"
                onClick={() => handleStudentSelect(internalSelectedStudent)}
                className={cn(
                  "w-full max-w-xs sm:max-w-sm h-auto py-3 px-4 flex flex-col items-center whitespace-normal text-center leading-snug"
                )}
              >
                <UsersIcon className="h-5 w-5 mb-1 flex-shrink-0" />
                <span className="text-sm">{internalSelectedStudent.name}</span>
                <span className="text-xs opacity-75">{internalSelectedStudent.className}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Seleção de Aluno */}
        <div
          className={cn(
            "mt-4 transition-all duration-500 ease-in-out",
            selectedClass && !internalSelectedStudent ? "opacity-100 max-h-[1000px] visible" : "opacity-0 max-h-0 invisible"
          )}
        >
          <h3 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2">
            Selecione o Aluno
          </h3>

          {/* Grid de Alunos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-1">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <Button
                  key={student.id}
                  type="button"
                  variant={"outline"}
                  onClick={() => handleStudentSelect(student)}
                  className={cn(
                    "w-full h-auto py-2 px-1.5 flex flex-col items-center whitespace-normal text-center leading-tight",
                    "hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  <StudentPhoto 
                    photoUrl={student.photo_url}
                    name={student.name}
                    size="md"
                    className="mb-1 flex-shrink-0"
                  />
                  <span className="text-xs">{student.name}</span>
                </Button>
              ))
            ) : selectedClass ? (
              <p className="text-sm text-muted-foreground mt-2 col-span-full">
                Nenhum aluno encontrado nesta turma.
              </p>
            ) : null}
          </div>
        </div>

        {/* Seleção de Material */}
        <div
          className={cn(
            "mt-4 transition-all duration-500 ease-in-out",
            internalSelectedStudent ? "opacity-100 max-h-[1000px] visible" : "opacity-0 max-h-0 invisible"
          )}
        >
          <h3 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2">
            Selecione o Material
          </h3>

          {/* Grid de Materiais */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 mt-1">
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col space-y-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 transition-all duration-200"
              onClick={() => handleMaterialSelect(MATERIAL_TYPES.LIDS)}
            >
              <PackageIcon className="h-8 w-8 mb-2 text-blue-600" />
              <span className="text-lg font-medium">Tampinhas</span>
              <span className="text-xs text-blue-600">Registrar troca de tampinhas plásticas</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col space-y-2 bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-800 hover:border-gray-400 transition-all duration-200"
              onClick={() => handleMaterialSelect(MATERIAL_TYPES.CANS)}
            >
              <ArchiveIcon className="h-8 w-8 mb-2 text-gray-600" />
              <span className="text-lg font-medium">Latinhas</span>
              <span className="text-xs text-gray-600">Registrar troca de latinhas</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col space-y-2 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800 hover:border-orange-300 transition-all duration-200"
              onClick={() => handleMaterialSelect(MATERIAL_TYPES.OIL)}
            >
              <DropletIcon className="h-8 w-8 mb-2 text-orange-600" />
              <span className="text-lg font-medium">Óleo</span>
              <span className="text-xs text-orange-600">Registrar troca de óleo usado</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
