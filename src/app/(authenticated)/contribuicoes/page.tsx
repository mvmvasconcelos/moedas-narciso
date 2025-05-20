"use client";

import { ContributionForm } from "@/components/contribuicoes/ContributionForm";
import { ClipboardPlusIcon } from "lucide-react";
import type { Metadata } from 'next';

// Cannot export metadata from client component.
// export const metadata: Metadata = {
//   title: 'Registrar Contribuições - Moedas Narciso',
// };

export default function ContribuicoesPage() {
  return (
    <div className="space-y-8">
        <div className="flex items-center">
            <ClipboardPlusIcon className="mr-3 h-8 w-8 text-primary" />
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Registrar Contribuições
                </h1>
                <p className="text-muted-foreground">
                Insira as contribuições recicláveis dos alunos para creditar Moedas Narciso.
                </p>
            </div>
        </div>
      <ContributionForm />
    </div>
  );
}
