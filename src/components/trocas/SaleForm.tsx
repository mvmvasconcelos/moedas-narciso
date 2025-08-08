'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { DataService, type Sale } from '@/lib/dataService';
import { getCurrentUser, getTeacherProfile } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

interface Student {
  id: string;
  nome: string;
  saldo: number;
  foto_url?: string;
}

interface SaleFormProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

interface FormData {
  produto: string;
  quantidade: number;
  valor_unitario: number;
  observacoes: string;
}

interface AlertState {
  type: 'error' | 'confirmation' | 'success' | null;
  title: string;
  description: string;
  isOpen: boolean;
}

export const SaleForm: React.FC<SaleFormProps> = ({ isOpen, onClose, student }) => {
  const { refreshStudents } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    produto: '',
    quantidade: 1,
    valor_unitario: 0,
    observacoes: ''
  });

  const [alert, setAlert] = useState<AlertState>({
    type: null,
    title: '',
    description: '',
    isOpen: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      produto: '',
      quantidade: 1,
      valor_unitario: 0,
      observacoes: ''
    });
  };

  const showAlert = (type: AlertState['type'], title: string, description: string) => {
    setAlert({
      type,
      title,
      description,
      isOpen: true
    });
  };

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.produto.trim()) {
      return 'Nome do produto é obrigatório';
    }
    
    if (formData.quantidade === 0) {
      return 'Quantidade não pode ser zero';
    }
    
    if (formData.valor_unitario === 0) {
      return 'Valor unitário não pode ser zero';
    }

    return null;
  };

  const calculateTotal = (): number => {
    return formData.quantidade * formData.valor_unitario;
  };

  const getTransactionDescription = (): string => {
    const total = calculateTotal();
    const isRefundOrAdjustment = total < 0;
    
    if (isRefundOrAdjustment) {
      return `Devolução/Correção: ${formData.produto} (${Math.abs(total)} moedas devolvidas)`;
    }
    
    return `Compra: ${formData.produto} - Qtd: ${formData.quantidade} x ${formData.valor_unitario} = ${total} moedas`;
  };

  const handleSubmit = () => {
    if (!student) return;

    const validationError = validateForm();
    if (validationError) {
      showAlert('error', 'Erro de Validação', validationError);
      return;
    }

    const total = calculateTotal();
    const newSaldo = student.saldo - total;
    const isRefundOrAdjustment = total < 0;
    
    const confirmationTitle = isRefundOrAdjustment ? 'Confirmar Devolução/Correção' : 'Confirmar Venda';
    const confirmationDescription = `
      Aluno: ${student.nome}
      ${getTransactionDescription()}
      
      Saldo atual: ${student.saldo} moedas
      Novo saldo: ${newSaldo} moedas
      
      ${isRefundOrAdjustment ? 'Deseja confirmar esta devolução/correção?' : 'Deseja confirmar esta venda?'}
    `;

    showAlert('confirmation', confirmationTitle, confirmationDescription);
  };

  const handleConfirmSubmit = async () => {
    if (!student) return;

    setIsSubmitting(true);
    closeAlert();

    try {
      const total = calculateTotal();
      
      // Obter o ID do professor atual
      const teacherProfile = await getTeacherProfile();
      if (!teacherProfile) {
        throw new Error('Professor não encontrado. Faça login novamente.');
      }
      
      // Registrar a venda/transação
      await DataService.createSale({
        student_id: student.id,
        coins_spent: total,
        item_description: `${formData.produto} - Qtd: ${formData.quantidade} x ${formData.valor_unitario}${formData.observacoes ? ` (${formData.observacoes})` : ''}`,
        teacher_id: teacherProfile.id
      });

      // Atualizar os dados dos alunos no contexto
      if (refreshStudents) {
        await refreshStudents();
      }

      // Mostrar mensagem de sucesso
      const isRefundOrAdjustment = total < 0;
      const successTitle = isRefundOrAdjustment ? 'Devolução/Correção Realizada!' : 'Venda Realizada!';
      const successDescription = `
        ${getTransactionDescription()}
        
        Novo saldo de ${student.nome}: ${(student.saldo - total)} moedas
      `;

      showAlert('success', successTitle, successDescription);
      resetForm();

    } catch (error) {
      console.error('Erro ao processar venda:', error);
      showAlert('error', 'Erro ao Processar', 'Ocorreu um erro ao processar a transação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    closeAlert();
    onClose();
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const renderAlertDialog = () => {
    if (!alert.isOpen) return null;

    switch (alert.type) {
      case 'error':
        return (
          <AlertDialog open={alert.isOpen} onOpenChange={closeAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600">{alert.title}</AlertDialogTitle>
                <AlertDialogDescription className="whitespace-pre-line">
                  {alert.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={closeAlert}>
                  OK
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );

      case 'confirmation':
        return (
          <AlertDialog open={alert.isOpen} onOpenChange={closeAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{alert.title}</AlertDialogTitle>
                <AlertDialogDescription className="whitespace-pre-line">
                  {alert.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={closeAlert} disabled={isSubmitting}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleConfirmSubmit} 
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Processando...' : 'Confirmar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );

      case 'success':
        return (
          <AlertDialog open={alert.isOpen} onOpenChange={handleSuccessClose}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-green-600">{alert.title}</AlertDialogTitle>
                <AlertDialogDescription className="whitespace-pre-line">
                  {alert.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={handleSuccessClose} className="bg-green-600 hover:bg-green-700">
                  OK
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Venda</DialogTitle>
          </DialogHeader>

          {student && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {student.foto_url && (
                  <img 
                    src={student.foto_url} 
                    alt={student.nome}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{student.nome}</p>
                  <p className="text-sm text-gray-600">
                    Saldo atual: {student.saldo} moedas
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="produto">Produto *</Label>
              <Input
                id="produto"
                value={formData.produto}
                onChange={(e) => handleInputChange('produto', e.target.value)}
                placeholder="Nome do produto"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantidade">Quantidade *</Label>
                <Input
                  id="quantidade"
                  type="number"
                  value={formData.quantidade}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permite valores negativos mas apenas números inteiros
                    if (value === '' || value === '-') {
                      handleInputChange('quantidade', 0);
                    } else {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue)) {
                        handleInputChange('quantidade', numValue);
                      }
                    }
                  }}
                  placeholder=""
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="valor_unitario">Valor </Label>
                <Input
                  id="valor_unitario"
                  type="number"
                  value={formData.valor_unitario}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permite valores negativos mas apenas números inteiros
                    if (value === '' || value === '-') {
                      handleInputChange('valor_unitario', 0);
                    } else {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue)) {
                        handleInputChange('valor_unitario', numValue);
                      }
                    }
                  }}
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Observações adicionais (opcional)"
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            {(formData.quantidade !== 0 && formData.valor_unitario !== 0) && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <strong>Valor Total: {calculateTotal()} moedas</strong>
                </p>
                {student && (
                  <p className="text-sm text-gray-600">
                    Saldo após transação: {(student.saldo - calculateTotal())} moedas
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Processando...' : 'Registrar Venda'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {renderAlertDialog()}
    </>
  );
};
