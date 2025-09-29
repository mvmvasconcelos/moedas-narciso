"use client";

import { Button } from "@/components/ui/button";
import type { Student, Class } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { UsersIcon } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StudentPhoto } from "@/components/alunos/StudentPhoto";

interface StudentSelectorProps {
  onStudentSelect: (student: Student) => void;
}

export function StudentSelector({ onStudentSelect }: StudentSelectorProps) {
  const { classes, students } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

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
    onStudentSelect(student);
  }

  return (
    <Card className="w-full shadow-xl">
      <CardContent className="space-y-6 pt-6">
        {/* Seleção de Turma */}
        <div>
          <h3 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2">
            Selecione a Turma
          </h3>
          
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

          {/* Botão da turma selecionada (visível se UMA turma ESTÁ selecionada) */}
          <div
            className={cn(
              "flex justify-center mt-1 transition-all duration-500 ease-in-out overflow-hidden",
              selectedClass ? "opacity-100 max-h-40 visible" : "opacity-0 max-h-0 invisible"
            )}
          >
            {selectedClass && sortedClasses.find(cls => cls.name === selectedClass) && (
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
        </div>

        {/* Seleção de Aluno */}
        <div
          className={cn(
            "mt-4 transition-all duration-500 ease-in-out",
            selectedClass ? "opacity-100 max-h-[1000px] visible" : "opacity-0 max-h-0 invisible"
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
      </CardContent>
    </Card>
  );
}
