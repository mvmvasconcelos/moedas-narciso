"use client";

import { Suspense, useState } from 'react';
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const materialParam = searchParams.get("material") as MaterialType | null;
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isValidMaterial = materialParam && Object.values(MATERIAL_TYPES).includes(materialParam);
  let pageTitle = "Registrar Trocas";
  let PageIcon = ClipboardPlusIcon;

  if (isValidMaterial && materialParam) {
    pageTitle = `Registrar trocas de ${MATERIAL_LABELS[materialParam].replace(" (unidades)","")}`;
    if (materialParam === MATERIAL_TYPES.LIDS) PageIcon = PackageIcon;
    else if (materialParam === MATERIAL_TYPES.CANS) PageIcon = ArchiveIcon;
    else if (materialParam === MATERIAL_TYPES.OIL) PageIcon = DropletIcon;
  }

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
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
              {isValidMaterial && materialParam
                ? `Insira as trocas de ${MATERIAL_LABELS[materialParam].toLowerCase()} dos alunos.`
                : "Escolha o tipo de material para começar a registrar trocas."}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/historico">
            Ver Histórico de Trocas
          </Link>
        </Button>
      </div>
      
      {isValidMaterial && materialParam ? (
        <>
          <StudentSelector onStudentSelect={handleStudentSelect} />
          {selectedStudent && (
            <ExchangeModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              student={selectedStudent}
              materialType={materialParam}
            />
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Selecione o tipo de material</h2>
            <p className="text-muted-foreground mb-6">
              Escolha o material que deseja registrar para começar o processo de troca.
            </p>
          </div>
          
          {/* Botões de seleção de material */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto">
            <Button asChild variant="outline" className="h-auto py-6 flex flex-col space-y-2">
              <Link href={`/trocas?material=${MATERIAL_TYPES.LIDS}`}>
                <PackageIcon className="h-8 w-8 mb-2" />
                <span className="text-lg font-medium">Tampinhas</span>
                <span className="text-xs text-muted-foreground">Registrar troca de tampinhas plásticas</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-6 flex flex-col space-y-2">
              <Link href={`/trocas?material=${MATERIAL_TYPES.CANS}`}>
                <ArchiveIcon className="h-8 w-8 mb-2" />
                <span className="text-lg font-medium">Latinhas</span>
                <span className="text-xs text-muted-foreground">Registrar troca de latinhas</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-6 flex flex-col space-y-2">
              <Link href={`/trocas?material=${MATERIAL_TYPES.OIL}`}>
                <DropletIcon className="h-8 w-8 mb-2" />
                <span className="text-lg font-medium">Óleo</span>
                <span className="text-xs text-muted-foreground">Registrar troca de óleo usado</span>
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
