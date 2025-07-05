"use client";

import { Suspense } from 'react';
import { useSearchParams } from "next/navigation";
import { ExchangeForm } from "@/components/trocas/ExchangeForm";
import { ClipboardPlusIcon, PackageIcon, ArchiveIcon, DropletIcon } from "lucide-react";
import { MATERIAL_TYPES, MATERIAL_LABELS, type MaterialType } from "@/lib/constants";
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

  const isValidMaterial = materialParam && Object.values(MATERIAL_TYPES).includes(materialParam);
  let pageTitle = "Registrar Trocas";
  let PageIcon = ClipboardPlusIcon;

  if (isValidMaterial && materialParam) {
    pageTitle = `Registrar trocas de ${MATERIAL_LABELS[materialParam].replace(" (unidades)","")}`;
    if (materialParam === MATERIAL_TYPES.LIDS) PageIcon = PackageIcon;
    else if (materialParam === MATERIAL_TYPES.CANS) PageIcon = ArchiveIcon;
    else if (materialParam === MATERIAL_TYPES.OIL) PageIcon = DropletIcon;
  }

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
                : "Selecione um material no painel para registrar trocas."}
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
        <ExchangeForm materialType={materialParam} />
      ) : (
        <Alert variant="destructive">
          <ClipboardPlusIcon className="h-4 w-4" />
          <AlertTitle>Material Não Especificado</AlertTitle>
          <AlertDescription>
            Por favor, selecione um tipo de material a partir do Painel de Estatísticas para registrar uma troca.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
