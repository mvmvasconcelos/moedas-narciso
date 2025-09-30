"use client";

import { Suspense, useState } from 'react';
import { StudentSelector } from "@/components/trocas/StudentSelector";
import { ExchangeModal } from "@/components/trocas/ExchangeModal";
import { ClipboardPlusIcon, PackageIcon, ArchiveIcon, DropletIcon } from "lucide-react";
import { MATERIAL_TYPES, MATERIAL_LABELS, type MaterialType, type Student } from "@/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TrocasPage() {
  return (
    <Suspense fallback={<div>Carregando detalhes da troca...</div>}>
      <TrocasContent />
    </Suspense>
  );
}

function TrocasContent() {
  // Estados simplificados - StudentSelector gerencia a navegação internamente
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Título simples
  const pageTitle = "Registrar Trocas";
  const PageIcon = ClipboardPlusIcon;

  // Handlers simplificados
  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleMaterialSelect = (materialType: MaterialType) => {
    setSelectedMaterial(materialType);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Mantém na seleção de material para permitir nova troca com o mesmo aluno
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <PageIcon className="mr-3 h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {pageTitle}
            </h1>
            <p className="text-muted-foreground">
              Selecione a turma, depois o aluno e por fim o tipo de material para registrar a troca.
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/historico">
            Ver Histórico de Trocas
          </Link>
        </Button>
      </div>
      
      {/* Interface unificada com StudentSelector */}
      <StudentSelector 
        onStudentSelect={handleStudentSelect}
        selectedStudent={selectedStudent}
        onMaterialSelect={handleMaterialSelect}
      />

      {/* Modal de troca */}
      {selectedStudent && selectedMaterial && (
        <ExchangeModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          student={selectedStudent}
          materialType={selectedMaterial}
        />
      )}
    </div>
  );
}
