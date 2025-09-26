'use client';

import React, { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
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
  valor_unitario: number;
  observacoes: string;
}

interface FormErrors {
  produto?: string;
  valor_unitario?: string;
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
    valor_unitario: 0,
    observacoes: ''
  });

  // Estado local para controlar o input de valor como string
  const [valorInput, setValorInput] = useState<string>('');

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [alert, setAlert] = useState<AlertState>({
    type: null,
    title: '',
    description: '',
    isOpen: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincroniza o valorInput com o formData quando necessário
  useEffect(() => {
    if (formData.valor_unitario !== 0 && valorInput === '') {
      setValorInput(formData.valor_unitario.toString());
    } else if (formData.valor_unitario === 0 && valorInput !== '' && valorInput !== '0') {
      // Só limpa se não estiver sendo editado ativamente
      const numValue = parseInt(valorInput);
      if (isNaN(numValue) || numValue === 0) {
        setValorInput('');
      }
    }
  }, [formData.valor_unitario, valorInput]);

  const resetForm = () => {
    setFormData({
      produto: '',
      valor_unitario: 0,
      observacoes: ''
    });
    setValorInput('');
    setFormErrors({});
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
    
    // Validar campo em tempo real
    if (field === 'produto' || field === 'valor_unitario') {
      setTimeout(() => validateField(field), 100);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.produto.trim()) {
      errors.produto = 'Nome do produto é obrigatório';
    }
    
    if (formData.valor_unitario === 0) {
      errors.valor_unitario = 'Valor não pode ser zero';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateField = (field: keyof FormData) => {
    const errors = { ...formErrors };
    
    switch (field) {
      case 'produto':
        if (!formData.produto.trim()) {
          errors.produto = 'Nome do produto é obrigatório';
        } else {
          delete errors.produto;
        }
        break;
      case 'valor_unitario':
        if (formData.valor_unitario === 0) {
          errors.valor_unitario = 'Valor não pode ser zero';
        } else {
          delete errors.valor_unitario;
        }
        break;
    }
    
    setFormErrors(errors);
  };

  const calculateTotal = (): number => {
    return formData.valor_unitario;
  };

  const getTransactionDescription = (): string => {
    const total = calculateTotal();
    return `Compra: ${formData.produto} - ${total} moedas`;
  };

  const handleSubmit = () => {
    if (!student) return;

    if (!validateForm()) {
      return;
    }

    const total = calculateTotal();
    const newSaldo = student.saldo - total;
    
    const confirmationTitle = 'Confirmar Venda';
    const confirmationDescription = `
      Aluno: ${student.nome}
      ${getTransactionDescription()}
      
      Saldo atual: ${student.saldo} moedas
      Novo saldo: ${newSaldo} moedas
      
      Deseja confirmar esta venda?
    `;

    showAlert('confirmation', confirmationTitle, confirmationDescription);
  };

  const handleConfirmSubmit = async () => {
    if (!student) return;

    setIsSubmitting(true);


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
        item_description: `${formData.produto}${formData.observacoes ? ` (${formData.observacoes})` : ''}`,
        teacher_id: teacherProfile.id
      });

      // Atualizar os dados dos alunos no contexto
      if (refreshStudents) {
        await refreshStudents();
      }

      // Mostrar mensagem de sucesso
      const successTitle = 'Venda Realizada!';
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
                  className={`bg-green-600 hover:bg-green-700 ${isSubmitting ? 'animate-pulse transform scale-95 opacity-90' : ''}`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-4 w-4" /> Processando...
                    </span>
                  ) : (
                    'Confirmar'
                  )}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Venda</DialogTitle>
          </DialogHeader>

          {student && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                {student.foto_url && (
                  <img 
                    src={student.foto_url} 
                    alt={`Foto de ${student.nome}`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{student.nome}</p>
                  <p className="text-sm text-gray-600">
                    Saldo atual: <span className="font-medium text-blue-600">{student.saldo} moedas</span>
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
                placeholder="Bola, mola maluca, etc."
                disabled={isSubmitting}
                className={formErrors.produto ? 'border-red-500 focus:border-red-500' : ''}
                aria-invalid={!!formErrors.produto}
                aria-describedby={formErrors.produto ? 'produto-error' : undefined}
              />
              {formErrors.produto && (
                <p id="produto-error" className="text-sm text-red-600 mt-1">
                  {formErrors.produto}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="valor_unitario">Valor (em moedas) *</Label>
              <div className="relative">
                <Input
                  id="valor_unitario"
                  type="text"
                  value={valorInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    
                    // Permite edição livre - aceita apenas números inteiros positivos
                    if (value === '') {
                      setValorInput(value);
                      handleInputChange('valor_unitario', 0);
                    } else if (/^\d*$/.test(value)) {
                      // Regex que permite apenas: números inteiros positivos
                      setValorInput(value);
                      
                      const numValue = parseInt(value);
                      if (!isNaN(numValue)) {
                        handleInputChange('valor_unitario', numValue);
                      }
                    }
                    // Se não passar na validação, simplesmente ignora a mudança
                  }}
                  onBlur={() => {
                    // Quando o usuário sai do campo, formata o valor
                    const numValue = parseInt(valorInput);
                    if (!isNaN(numValue) && numValue !== 0) {
                      setValorInput(numValue.toString());
                    } else if (valorInput === '') {
                      setValorInput('');
                      handleInputChange('valor_unitario', 0);
                    }
                  }}
                  onFocus={() => {
                    // Quando entra no campo, se estiver vazio, deixa vazio para edição
                    if (valorInput === '0') {
                      setValorInput('');
                    }
                  }}
                  placeholder="Ex: 5"
                  disabled={isSubmitting}
                  className={`pl-8 ${formErrors.valor_unitario ? 'border-red-500 focus:border-red-500' : ''}`}
                  aria-invalid={!!formErrors.valor_unitario}
                  aria-describedby={formErrors.valor_unitario ? 'valor_unitario-error' : undefined}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  🪙
                </span>
              </div>
              {formErrors.valor_unitario && (
                <p id="valor_unitario-error" className="text-sm text-red-600 mt-1">
                  {formErrors.valor_unitario}
                </p>
              )}
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

            <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Valor Total:</span>
                <span className={`text-lg font-bold ${calculateTotal() < 0 ? 'text-green-600' : calculateTotal() > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                  {calculateTotal()} moedas
                </span>
              </div>
              {student && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Saldo após transação:</span>
                  <span className={`text-sm font-medium ${(student.saldo - calculateTotal()) < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                    {(student.saldo - calculateTotal())} moedas
                    {(student.saldo - calculateTotal()) < 0 && (
                      <span className="ml-2 text-xs text-red-500">(saldo insuficiente)</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.produto.trim() || formData.valor_unitario === 0}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:opacity-50"
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
