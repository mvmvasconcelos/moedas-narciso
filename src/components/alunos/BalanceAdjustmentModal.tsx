"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataService } from "@/lib/dataService";

interface Props {
  studentId: string;
  studentName: string;
  currentBalance: number;
  onClose: () => void;
  onApplied: (newBalance: number) => void;
}

export default function BalanceAdjustmentModal({ studentId, studentName, currentBalance, onClose, onApplied }: Props) {
  const [value, setValue] = useState<string>("0");
  const [step, setStep] = useState<'input'|'confirm'|'success'>('input');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBalance, setResultBalance] = useState<number | null>(null);

  const parsed = Number(value);
  const delta = Number.isFinite(parsed) ? Math.trunc(parsed) : NaN;
  const newBalance = Number.isFinite(parsed) ? currentBalance + Math.trunc(parsed) : currentBalance;

  const openConfirm = () => {
    setError(null);
    if (!Number.isFinite(parsed) || parsed === 0) {
      setError('Informe um valor numérico diferente de zero.');
      return;
    }
    setStep('confirm');
  };

  const apply = async () => {
    setIsApplying(true);
    setError(null);
    try {
      const res = await DataService.adjustStudentCoins(studentId, delta);
      setResultBalance(res.after);
      setStep('success');
    } catch (err: any) {
      setError(err?.message || 'Erro ao aplicar ajuste');
    } finally {
      setIsApplying(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        {step === 'input' && (
          <>
            <DialogHeader>
              <DialogTitle>Ajustar saldo de {studentName}</DialogTitle>
              <DialogDescription>Saldo atual: {currentBalance} moedas</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Valor do ajuste (positivo ou negativo)</label>
                <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
                <p className="text-sm text-muted-foreground mt-1">Use valores positivos para crédito e negativos para débito.</p>
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
              {Number.isFinite(parsed) && newBalance < 0 && (
                <div className="text-sm text-amber-700">Aviso: o saldo ficará negativo ({newBalance} moedas).</div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isApplying}>Cancelar</Button>
              <Button onClick={openConfirm} disabled={isApplying}>Ajustar</Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle>Confirmar ajuste</DialogTitle>
              <DialogDescription asChild>
                <div className="whitespace-normal leading-relaxed text-sm max-w-[40rem]">
                  <p>O novo saldo de <strong>{studentName}</strong> será de <strong>{newBalance}</strong> moedas.</p>
                  <p className="mt-2">O saldo anterior era <strong>{currentBalance}</strong>. Deseja confirmar o ajuste?</p>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('input')} disabled={isApplying}>Voltar</Button>
              <Button onClick={apply} disabled={isApplying}>{isApplying ? 'Aplicando...' : 'Confirmar'}</Button>
            </div>
            {error && <div className="text-sm text-destructive mt-3">{error}</div>}
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle>Ajuste realizado</DialogTitle>
              <DialogDescription asChild>
                <div className="whitespace-normal leading-relaxed text-sm">
                  <p>O saldo foi atualizado com sucesso.</p>
                  <p className="mt-2">Saldo atual: <strong>{resultBalance}</strong> moedas.</p>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex justify-end">
              <Button onClick={() => { onApplied(resultBalance ?? newBalance); handleClose(); }}>Fechar</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
