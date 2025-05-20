"use client";

import { useState } from "react";
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
import { Edit3Icon, Trash2Icon, MoreVerticalIcon, CoinsIcon, PackageIcon, ArchiveIcon, DropletIcon } from "lucide-react";
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

interface StudentsTableProps {
  onEditStudent: (student: Student) => void;
}

export function StudentsTable({ onEditStudent }: StudentsTableProps) {
  const { students, deleteStudent } = useAuth();
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const handleDeleteConfirmation = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  if (!students || students.length === 0) {
    return (
      <Alert>
        <PackageIcon className="h-4 w-4" />
        <AlertTitle>Nenhum aluno cadastrado!</AlertTitle>
        <AlertDescription>
          Adicione alunos para começar a registrar suas contribuições.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <ScrollArea className="h-[calc(100vh-20rem)] rounded-md border"> {/* Adjust height as needed */}
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead className="text-center">
                <CoinsIcon className="inline-block h-4 w-4 mr-1" /> Moedas
              </TableHead>
              <TableHead className="text-center hidden md:table-cell">
                <PackageIcon className="inline-block h-4 w-4 mr-1" /> Tampas
              </TableHead>
              <TableHead className="text-center hidden md:table-cell">
                <ArchiveIcon className="inline-block h-4 w-4 mr-1" /> Latas
              </TableHead>
              <TableHead className="text-center hidden md:table-cell">
                <DropletIcon className="inline-block h-4 w-4 mr-1" /> Óleo
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.className}</TableCell>
                <TableCell className="text-center font-semibold text-primary">
                  {student.narcisoCoins}
                </TableCell>
                <TableCell className="text-center hidden md:table-cell">
                  {student.contributions.tampas}
                </TableCell>
                <TableCell className="text-center hidden md:table-cell">
                  {student.contributions.latas}
                </TableCell>
                <TableCell className="text-center hidden md:table-cell">
                  {student.contributions.oleo}
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
