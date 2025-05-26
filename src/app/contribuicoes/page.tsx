"use client";

import { Suspense } from 'react';
import { useSearchParams } from "next/navigation";
import { ContributionForm } from "@/components/contribuicoes/ContributionForm";
import { ClipboardPlusIcon, PackageIcon, ArchiveIcon, DropletIcon } from "lucide-react";
import { MATERIAL_TYPES, MATERIAL_LABELS, type MaterialType } from "@/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ContribuicoesPage() {
  return (
    <Suspense fallback={<div>Carregando detalhes da contribuição...</div>}>
      <ContribuicoesContent />
    </Suspense>
  );
}

function ContribuicoesContent() {
  const searchParams = useSearchParams();
  const materialParam = searchParams.get("material") as MaterialType | null;

  const isValidMaterial = materialParam && Object.values(MATERIAL_TYPES).includes(materialParam);

  let pageTitle = "Registrar Contribuições";
  let PageIcon = ClipboardPlusIcon;

  if (isValidMaterial && materialParam) {
    pageTitle = `Registrar trocas de ${MATERIAL_LABELS[materialParam].replace(" (unidades)","")}`;
    if (materialParam === MATERIAL_TYPES.LIDS) PageIcon = PackageIcon;
    else if (materialParam === MATERIAL_TYPES.CANS) PageIcon = ArchiveIcon;
    else if (materialParam === MATERIAL_TYPES.OIL) PageIcon = DropletIcon;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <PageIcon className="mr-3 h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {pageTitle}
          </h1>
          <p className="text-muted-foreground">
            {isValidMaterial && materialParam
              ? `Insira as contribuições de ${MATERIAL_LABELS[materialParam].toLowerCase()} dos alunos.`
              : "Selecione um material no painel para registrar contribuições."}
          </p>
        </div>
      </div>
      {isValidMaterial && materialParam ? (
        <ContributionForm materialType={materialParam} />
      ) : (
        <Alert variant="destructive">
          <ClipboardPlusIcon className="h-4 w-4" />
          <AlertTitle>Material Não Especificado</AlertTitle>
          <AlertDescription>
            Por favor, selecione um tipo de material a partir do Painel de Estatísticas para registrar uma contribuição.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
