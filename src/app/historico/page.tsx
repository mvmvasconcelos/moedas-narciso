"use client";

import { Suspense } from 'react';
import { HistoryIcon } from "lucide-react";
import { ExchangeHistory } from "@/components/trocas/ExchangeHistory";

export default function HistoricoPage() {
  return (
    <Suspense fallback={<div>Carregando histórico de trocas...</div>}>
      <HistoricoContent />
    </Suspense>
  );
}

function HistoricoContent() {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <HistoryIcon className="mr-3 h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Histórico de Trocas
          </h1>
          <p className="text-muted-foreground">
            Consulte o histórico completo de trocas registradas no sistema.
          </p>
        </div>
      </div>
      
      <ExchangeHistory />
    </div>
  );
}
