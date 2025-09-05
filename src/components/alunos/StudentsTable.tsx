"use client";

import { useState, memo, useMemo } from "react";
import type { Student } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit3Icon, Trash2Icon, MoreVerticalIcon, CoinsIcon, PackageIcon, ArchiveIcon, DropletIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { StudentPhotoSmall } from "@/components/alunos/StudentPhoto";

type SortField = "name" | "className" | "narcisoCoins" | "currentCoinBalance" | "lids" | "cans" | "oil";
type SortDirection = "asc" | "desc";

interface StudentsTableProps {
  onEditStudent: (student: Student) => void;
}

// Função interna para o componente antes da memoização
function StudentsTableBase({ onEditStudent }: StudentsTableProps) {
  const { students, deleteStudent, isAuthenticated, studentsLoading } = useAuth();
  const { toast } = useToast();
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Função para alternar a direção da ordenação
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Função para renderizar o ícone de ordenação
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUpIcon className="inline-block h-4 w-4 ml-1" />
    ) : (
      <ChevronDownIcon className="inline-block h-4 w-4 ml-1" />
    );
  };

  // Função para ordenar os alunos
  const sortedStudents = useMemo(() => {
    if (!students) return [];
    
    return [...students].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      
      switch (sortField) {
        case "name":
          return direction * a.name.localeCompare(b.name);
        case "className":
          return direction * (a.className || "").localeCompare(b.className || "");
        case "narcisoCoins":
          return direction * ((a.narcisoCoins || 0) - (b.narcisoCoins || 0));
        case "currentCoinBalance":
          return direction * ((a.currentCoinBalance || 0) - (b.currentCoinBalance || 0));
        case "lids":
          return direction * ((a.exchanges?.tampas || 0) - (b.exchanges?.tampas || 0));
        case "cans":
          return direction * ((a.exchanges?.latas || 0) - (b.exchanges?.latas || 0));
        case "oil":
          return direction * ((a.exchanges?.oleo || 0) - (b.exchanges?.oleo || 0));
        default:
          return 0;
      }
    });
  }, [students, sortField, sortDirection]);

  const handleDeleteConfirmation = async () => {
    if (studentToDelete) {
      try {
        await deleteStudent(studentToDelete.id);
        toast({
          title: "Sucesso!",
          description: `Aluno ${studentToDelete.name} excluído com sucesso.`,
        });
        setStudentToDelete(null);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao excluir",
          description: `Não foi possível excluir o aluno ${studentToDelete.name}. Tente novamente.`,
        });
      }
    }
  };

  // Mostrar spinner durante carregamento inicial
  if (isAuthenticated && studentsLoading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <div className="text-lg font-medium">Carregando dados dos alunos...</div>
      </div>
    );
  }
  
  // Se já carregou e não há dados
  if (!students || students.length === 0) {
    return (
      <Alert>
        <PackageIcon className="h-4 w-4" />
        <AlertTitle>Nenhum aluno cadastrado!</AlertTitle>
        <AlertDescription>
          Adicione alunos para começar a registrar suas trocas.
        </AlertDescription>
      </Alert>
    );
  }

  // Classe comum para os cabeçalhos de tabela clicáveis
  const sortableHeaderClass = "cursor-pointer hover:text-primary transition-colors duration-200";

  return (
    <>
      <ScrollArea className="h-[calc(100vh-20rem)] rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-12">Foto</TableHead>
              <TableHead
                onClick={() => toggleSort("name")}
                className={sortableHeaderClass}
              >
                Nome
                <SortIcon field="name" />
              </TableHead>
              <TableHead
                onClick={() => toggleSort("className")}
                className={sortableHeaderClass}
              >
                Turma
                <SortIcon field="className" />
              </TableHead>
              <TableHead
                onClick={() => toggleSort("narcisoCoins")}
                className={cn("text-center", sortableHeaderClass)}
              >
                <CoinsIcon className="inline-block h-4 w-4 mr-1" /> Moedas
                <SortIcon field="narcisoCoins" />
              </TableHead>
              <TableHead
                onClick={() => toggleSort("currentCoinBalance")}
                className={cn("text-center", sortableHeaderClass)}
              >
                <CoinsIcon className="inline-block h-4 w-4 mr-1" /> Saldo Atual
                <SortIcon field="currentCoinBalance" />
              </TableHead>
              <TableHead
                onClick={() => toggleSort("lids")}
                className={cn("text-center hidden md:table-cell", sortableHeaderClass)}
              >
                <PackageIcon className="inline-block h-4 w-4 mr-1" /> Tampas
                <SortIcon field="lids" />
              </TableHead>
              <TableHead
                onClick={() => toggleSort("cans")}
                className={cn("text-center hidden md:table-cell", sortableHeaderClass)}
              >
                <ArchiveIcon className="inline-block h-4 w-4 mr-1" /> Latas
                <SortIcon field="cans" />
              </TableHead>
              <TableHead
                onClick={() => toggleSort("oil")}
                className={cn("text-center hidden md:table-cell", sortableHeaderClass)}
              >
                <DropletIcon className="inline-block h-4 w-4 mr-1" /> Óleo
                <SortIcon field="oil" />
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="p-2">
                  <StudentPhotoSmall 
                    photoUrl={student.photo_url}
                    name={student.name}
                  />
                </TableCell>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.className}</TableCell>
                <TableCell className="text-center font-semibold text-primary">
                  {student.narcisoCoins || 0}
                </TableCell>
                <TableCell className="text-center font-semibold text-green-600">
                  {student.currentCoinBalance ?? student.narcisoCoins ?? 0}
                </TableCell>
                <TableCell className="text-center hidden md:table-cell">
                  {student.exchanges?.tampas || 0}
                </TableCell>
                <TableCell className="text-center hidden md:table-cell">
                  {student.exchanges?.latas || 0}
                </TableCell>
                <TableCell className="text-center hidden md:table-cell">
                  {student.exchanges?.oleo || 0}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditStudent(student)}>
                        <Edit3Icon className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setStudentToDelete(student)}
                        className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                      >
                        <Trash2Icon className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {studentToDelete && (
        <AlertDialog open onOpenChange={() => setStudentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o aluno "{studentToDelete.name}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirmation} className="bg-destructive hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

// Exporta o componente memoizado para evitar re-renderizações desnecessárias
export const StudentsTable = memo(StudentsTableBase);
