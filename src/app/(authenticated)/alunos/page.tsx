"use client";

import { useState } from "react";
import type { Student } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentForm } from "@/components/alunos/StudentForm";
import { StudentsTable } from "@/components/alunos/StudentsTable";
import { PlusCircleIcon, UsersIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Metadata } from 'next';

// Cannot export metadata from client component.
// export const metadata: Metadata = {
//   title: 'Gerenciar Alunos - Moedas Narciso',
// };


export default function AlunosPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const handleOpenForm = (student?: Student) => {
    setEditingStudent(student || null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingStudent(null);
  };

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <UsersIcon className="mr-3 h-8 w-8 text-primary" />
            Gerenciar Alunos
            </h1>
            <p className="text-muted-foreground">
            Adicione, edite ou exclua informações dos alunos.
            </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenForm()}>
              <PlusCircleIcon className="mr-2 h-5 w-5" />
              Adicionar Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingStudent ? "Editar Aluno" : "Adicionar Novo Aluno"}</DialogTitle>
              <DialogDescription>
                {editingStudent
                  ? "Modifique os dados do aluno selecionado."
                  : "Preencha os dados para cadastrar um novo aluno."}
              </DialogDescription>
            </DialogHeader>
            <StudentForm student={editingStudent} onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg">
        <CardContent className="pt-6"> {/* Added pt-6 for padding */}
          <StudentsTable onEditStudent={handleOpenForm} />
        </CardContent>
      </Card>
    </div>
  );
}
