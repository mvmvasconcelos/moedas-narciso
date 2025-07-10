"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Student, MaterialType } from "@/lib/constants";
import { MATERIAL_LABELS, MATERIAL_TYPES } from "@/lib/constants";
import { DataService } from "@/lib/dataService";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CoinsIcon, PackageIcon, ArchiveIcon, DropletIcon, SaveIcon, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { StudentPhoto } from "@/components/alunos/StudentPhoto";

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  materialType: MaterialType;
}

// Schema para validação do formulário
const createExchangeFormSchema = (materialType: MaterialType) => {
  return z.object({
    [materialType]: z.coerce.number().min(1, `A quantidade de ${MATERIAL_LABELS[materialType].toLowerCase().replace(" (unidades)","")} deve ser maior que zero.`),
    materialSobrando: z.coerce.number().min(0, "A quantidade sobrando deve ser zero ou maior."),
    moedasNestaTroca: z.coerce.number().min(0, "A quantidade de moedas deve ser zero ou maior."),
    totalMoedasAposTroca: z.coerce.number().min(0, "O total de moedas deve ser zero ou maior."),
  });
};

export function ExchangeModal({ isOpen, onClose, student, materialType }: ExchangeModalProps) {
  const { students, registerExchange } = useAuth();
  const { toast } = useToast();
  const [currentStudent, setCurrentStudent] = useState<Student>(student);

  // Estados para notificações melhoradas
  const [errorAlert, setErrorAlert] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
  }>({
    isOpen: false,
    title: '',
    description: ''
  });
  
  const [successAlert, setSuccessAlert] = useState<{
    isVisible: boolean;
    message: string;
  }>({
    isVisible: false,
    message: ''
  });

  const [confirmationAlert, setConfirmationAlert] = useState<{
    isOpen: boolean;
    materialQuantity: number;
    coinsToReceive: number;
    materialName: string;
  }>({
    isOpen: false,
    materialQuantity: 0,
    coinsToReceive: 0,
    materialName: ''
  });

  const currentSchema = createExchangeFormSchema(materialType);
  type ExchangeFormValues = z.infer<typeof currentSchema>;

  const form = useForm<ExchangeFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      [materialType]: 0,
      materialSobrando: 0,
      moedasNestaTroca: 0,
      totalMoedasAposTroca: 0,
    },
  });

  const watchedMaterialQuantity = form.watch(materialType);
  const watchedMaterialSobrando = form.watch("materialSobrando");
  const watchedMoedasNestaTroca = form.watch("moedasNestaTroca");
  const watchedTotalMoedasAposTroca = form.watch("totalMoedasAposTroca");

  // Funções para controlar notificações
  const showErrorAlert = (title: string, description: string) => {
    setErrorAlert({
      isOpen: true,
      title,
      description
    });
  };

  const showSuccessAlert = (message: string) => {
    setSuccessAlert({
      isVisible: true,
      message
    });
    // Remove o alerta de sucesso após 4 segundos
    setTimeout(() => {
      setSuccessAlert({ isVisible: false, message: '' });
    }, 4000);
  };

  const showConfirmationAlert = (materialQuantity: number, coinsToReceive: number, materialName: string) => {
    setConfirmationAlert({
      isOpen: true,
      materialQuantity,
      coinsToReceive,
      materialName
    });
  };

  // Atualizar dados do estudante quando os dados globais mudarem
  useEffect(() => {
    const updatedStudent = students.find(s => s.id === student.id);
    if (updatedStudent) {
      setCurrentStudent(updatedStudent);
    }
  }, [students, student.id]);

  // Estado para armazenar as taxas de conversão
  const [conversionRates, setConversionRates] = useState({
    [MATERIAL_TYPES.LIDS]: 20,
    [MATERIAL_TYPES.CANS]: 30,
    [MATERIAL_TYPES.OIL]: 2
  });
  
  // Buscar taxas de conversão atuais
  useEffect(() => {
    const fetchConversionRates = async () => {
      try {
        const rates = await DataService.getCurrentConversionRates();
        setConversionRates(rates);
      } catch (error) {
        console.error("Erro ao buscar taxas de conversão:", error);
      }
    };
    
    fetchConversionRates();
  }, []);

  // Calcula quantas moedas o aluno receberá com esta contribuição
  const coinsFromCurrentContribution = useMemo(() => {
    if (!currentStudent || 
        typeof watchedMaterialQuantity !== 'number' || 
        watchedMaterialQuantity <= 0) {
      return 0;
    }
    
    const unitsPerCoin = conversionRates[materialType];
    const currentPendingForMaterial = currentStudent.pendingExchanges?.[materialType] || 0;
    const totalPendingAfterContribution = currentPendingForMaterial + watchedMaterialQuantity;
    
    return Math.floor(totalPendingAfterContribution / unitsPerCoin) - 
           Math.floor(currentPendingForMaterial / unitsPerCoin);
  }, [currentStudent, watchedMaterialQuantity, materialType, conversionRates]);

  // Função para processar a submissão do formulário (apenas validação)
  const processSubmit = async () => {
    try {
      const material = materialType as "tampas" | "latas" | "oleo";
      const quantity = watchedMaterialQuantity as number;
      
      if (!material || !quantity || quantity <= 0) {
        showErrorAlert(
          "Quantidade inválida",
          `A quantidade de ${MATERIAL_LABELS[material].toLowerCase().replace(" (unidades)","")} deve ser maior que zero.`
        );
        return;
      }

      // Validação educacional - verificar se os cálculos do aluno estão corretos
      const currentPending = currentStudent.pendingExchanges?.[materialType] || 0;
      const totalMaterial = currentPending + quantity;
      const unitsPerCoin = conversionRates[materialType];
      
      // Cálculos corretos
      const correctCoinsFromThisTrade = Math.floor(totalMaterial / unitsPerCoin) - Math.floor(currentPending / unitsPerCoin);
      const correctMaterialSobrando = totalMaterial - (Math.floor(totalMaterial / unitsPerCoin) * unitsPerCoin);
      const correctTotalCoinsAfterTrade = (currentStudent.narcisoCoins || 0) + correctCoinsFromThisTrade;

      // Validar cada campo
      if (watchedMaterialSobrando !== correctMaterialSobrando) {
        showErrorAlert(
          "❌ Quantidade de material sobrando incorreta",
          "Verifique o cálculo da quantidade de material que vai sobrar após a troca. Pense bem: quantas unidades vão sobrar depois de trocar pelas moedas?"
        );
        return;
      }

      if (watchedMoedasNestaTroca !== correctCoinsFromThisTrade) {
        showErrorAlert(
          "❌ Quantidade de moedas desta troca incorreta", 
          `Verifique o cálculo de quantas moedas ${currentStudent.gender === 'feminino' ? 'a aluna' : 'o aluno'} vai receber nesta troca. Lembre-se da taxa de conversão!`
        );
        return;
      }

      if (watchedTotalMoedasAposTroca !== correctTotalCoinsAfterTrade) {
        showErrorAlert(
          "❌ Total de moedas após a troca incorreto",
          `Verifique o cálculo do total de moedas que ${currentStudent.gender === 'feminino' ? 'a aluna' : 'o aluno'} vai ter após esta troca. Some as moedas que já tem com as novas moedas!`
        );
        return;
      }

      // Se chegou até aqui, todos os cálculos estão corretos - mostrar confirmação
      const materialName = MATERIAL_LABELS[material].toLowerCase().replace(" (unidades)", "").replace(" (litros)", "");
      showConfirmationAlert(quantity, correctCoinsFromThisTrade, materialName);

    } catch (error) {
      // Mostrar mensagem de erro para o usuário com detalhes quando disponível
      let errorMessage = "Ocorreu um erro ao tentar registrar a troca. Tente novamente.";
      
      // Verificar se é um erro do Supabase com detalhes adicionais
      if (error instanceof Error && error.message) {
        if (error.message.includes("not-authorized")) {
          errorMessage = "❌ Você não tem permissão para registrar trocas.";
        } else if (error.message.includes("student-not-found")) {
          errorMessage = "❌ Aluno não encontrado no sistema.";
        } else if (error.message.includes("database")) {
          errorMessage = "❌ Erro de conexão com o banco de dados. Tente novamente em alguns instantes.";
        }
      }
      
      showErrorAlert(
        "Erro ao registrar troca",
        errorMessage
      );
    }
  };

  // Função para confirmar e executar a troca
  const confirmAndExecuteTrade = async () => {
    try {
      const material = materialType as "tampas" | "latas" | "oleo";
      const quantity = watchedMaterialQuantity as number;

      // Fechar o modal de confirmação
      setConfirmationAlert({ isOpen: false, materialQuantity: 0, coinsToReceive: 0, materialName: '' });

      // Executar o registro da troca
      const success = await registerExchange(currentStudent.id, material, quantity);
      
      if (!success) {
        throw new Error("Falha ao registrar a troca no sistema");
      }

      // Mostrar mensagem de sucesso
      showSuccessAlert(
        `🎉 Parabéns! Troca registrada com sucesso! ${quantity} ${MATERIAL_LABELS[material].toLowerCase()} de ${currentStudent.name} foram registrados.`
      );
      
      // Resetar todos os campos
      form.reset({
        [materialType]: 0,
        materialSobrando: 0,
        moedasNestaTroca: 0,
        totalMoedasAposTroca: 0,
      });

      // Atualizar dados do aluno
      const updatedStudentData = students.find(s => s.id === currentStudent.id);
      if (updatedStudentData) {
        setCurrentStudent(updatedStudentData);
      }

      // Fechar o modal após sucesso (com delay para mostrar o sucesso)
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      // Mostrar mensagem de erro para o usuário com detalhes quando disponível
      let errorMessage = "Ocorreu um erro ao tentar registrar a troca. Tente novamente.";
      
      // Verificar se é um erro do Supabase com detalhes adicionais
      if (error instanceof Error && error.message) {
        if (error.message.includes("not-authorized")) {
          errorMessage = "❌ Você não tem permissão para registrar trocas.";
        } else if (error.message.includes("student-not-found")) {
          errorMessage = "❌ Aluno não encontrado no sistema.";
        } else if (error.message.includes("database")) {
          errorMessage = "❌ Erro de conexão com o banco de dados. Tente novamente em alguns instantes.";
        }
      }
      
      showErrorAlert(
        "Erro ao registrar troca",
        errorMessage
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processSubmit();
  };

  // Reset form e notificações quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      form.reset({
        [materialType]: 0,
        materialSobrando: 0,
        moedasNestaTroca: 0,
        totalMoedasAposTroca: 0,
      });
      
      // Limpar notificações
      setErrorAlert({ isOpen: false, title: '', description: '' });
      setSuccessAlert({ isVisible: false, message: '' });
      setConfirmationAlert({ isOpen: false, materialQuantity: 0, coinsToReceive: 0, materialName: '' });
    }
  }, [isOpen, form, materialType]);

  const MaterialIcon =
    materialType === MATERIAL_TYPES.LIDS ? PackageIcon :
    materialType === MATERIAL_TYPES.CANS ? ArchiveIcon :
    DropletIcon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MaterialIcon className="mr-2 h-5 w-5 text-primary" />
            Trocar {MATERIAL_LABELS[materialType].replace(" (unidades)","")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Banner de Sucesso */}
            {successAlert.isVisible && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <AlertDescription className="text-base font-medium pl-2">
                  {successAlert.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Informações do Aluno */}
            <div className="flex items-center space-x-4 p-4 border rounded-md bg-card">
              <StudentPhoto 
                photoUrl={currentStudent.photo_url}
                name={currentStudent.name}
                size="xl"
                className="flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="font-medium text-lg">{currentStudent.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{currentStudent.className}</p>
                <div className="flex items-center mb-2">
                  <CoinsIcon className="mr-1 h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{currentStudent.narcisoCoins || 0} Moedas</span>
                </div>
                <div className="p-2 bg-orange-50 border border-orange-200 rounded-md">
                  <div className="text-center">
                    <div className="text-sm font-medium text-orange-800 flex items-center justify-center mb-1">
                      <MaterialIcon className="mr-1 h-4 w-4" />
                      Quantidade de {MATERIAL_LABELS[materialType].toLowerCase().replace(" (unidades)","")}
                    </div>
                    <div className="text-sm font-medium text-orange-800">sobrando</div>
                    <div className="text-lg font-bold text-orange-800 mt-1">
                      {currentStudent.pendingExchanges?.[materialType] || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campos de Quantidade */}
            <div className="space-y-4">
              {/* Campo de Quantidade Principal */}
              <FormField
                control={form.control}
                name={materialType}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-base font-semibold">
                      <MaterialIcon className="mr-2 h-5 w-5 text-primary" />
                      Quantidade de {MATERIAL_LABELS[materialType]} que {currentStudent.gender === 'feminino' ? 'a aluna' : 'o aluno'} trouxe
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Digite a quantidade"
                        {...field}
                        onChange={e => {
                          const value = e.target.value.replace(/^0+/, '') || '0';
                          const numericValue = Math.max(0, parseInt(value, 10) || 0);
                          field.onChange(numericValue);
                        }}
                        value={field.value === undefined || field.value === null || isNaN(Number(field.value)) ? '' : String(field.value)}
                        className="text-center text-2xl h-14 font-bold border-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo Material Sobrando */}
              <FormField
                control={form.control}
                name="materialSobrando"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <MaterialIcon className="mr-2 h-4 w-4 text-primary" />
                      Qual é a quantidade de {MATERIAL_LABELS[materialType].toLowerCase().replace(" (unidades)","")} que vai sobrar após a troca?
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Digite a quantidade"
                        {...field}
                        onChange={e => {
                          const value = e.target.value.replace(/^0+/, '') || '0';
                          const numericValue = Math.max(0, parseInt(value, 10) || 0);
                          field.onChange(numericValue);
                        }}
                        value={field.value === undefined || field.value === null || isNaN(Number(field.value)) ? '' : String(field.value)}
                        className="text-center text-xl h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo Moedas Nesta Troca */}
              <FormField
                control={form.control}
                name="moedasNestaTroca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <CoinsIcon className="mr-2 h-4 w-4 text-primary" />
                      Quantas moedas {currentStudent.gender === 'feminino' ? 'a aluna' : 'o aluno'} vai receber nesta troca?
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Digite a quantidade"
                        {...field}
                        onChange={e => {
                          const value = e.target.value.replace(/^0+/, '') || '0';
                          const numericValue = Math.max(0, parseInt(value, 10) || 0);
                          field.onChange(numericValue);
                        }}
                        value={field.value === undefined || field.value === null || isNaN(Number(field.value)) ? '' : String(field.value)}
                        className="text-center text-xl h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo Total de Moedas Após Troca */}
              <FormField
                control={form.control}
                name="totalMoedasAposTroca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <CoinsIcon className="mr-2 h-4 w-4 text-primary" />
                      Qual será o TOTAL DE MOEDAS que {currentStudent.gender === 'feminino' ? 'a aluna' : 'o aluno'} vai ter após esta troca?
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Digite a quantidade"
                        {...field}
                        onChange={e => {
                          const value = e.target.value.replace(/^0+/, '') || '0';
                          const numericValue = Math.max(0, parseInt(value, 10) || 0);
                          field.onChange(numericValue);
                        }}
                        value={field.value === undefined || field.value === null || isNaN(Number(field.value)) ? '' : String(field.value)}
                        className="text-center text-xl h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || !watchedMaterialQuantity || (typeof watchedMaterialQuantity === 'number' && watchedMaterialQuantity <= 0)}
              >
                <SaveIcon className="mr-2 h-4 w-4" />
                Registrar Troca
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* Alert Dialog para Erros */}
      <AlertDialog open={errorAlert.isOpen} onOpenChange={(open) => setErrorAlert({ ...errorAlert, isOpen: open })}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600 text-xl">
              <XCircle className="h-8 w-8 mr-3" />
              {errorAlert.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-700 leading-relaxed pt-2">
              {errorAlert.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setErrorAlert({ ...errorAlert, isOpen: false })}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 text-base"
            >
              Entendi, vou tentar novamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog para Confirmação */}
      <AlertDialog open={confirmationAlert.isOpen} onOpenChange={(open) => setConfirmationAlert({ ...confirmationAlert, isOpen: open })}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-blue-600 text-xl">
              <AlertCircle className="h-8 w-8 mr-3" />
              Confirmar Troca
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="text-base text-gray-700 leading-relaxed pt-2">
            <div className="space-y-2">
              <p>
                <strong>Tem certeza que deseja confirmar a troca de:</strong>
              </p>
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <p className="text-lg">
                  <span className="font-bold text-blue-800">{confirmationAlert.materialQuantity}</span> {confirmationAlert.materialName}
                </p>
                <p className="text-lg">
                  por <span className="font-bold text-blue-800">{confirmationAlert.coinsToReceive}</span> {confirmationAlert.coinsToReceive === 1 ? 'moeda' : 'moedas'}?
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
          <AlertDialogFooter className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setConfirmationAlert({ ...confirmationAlert, isOpen: false })}
              className="px-6"
            >
              Cancelar
            </Button>
            <AlertDialogAction 
              onClick={confirmAndExecuteTrade}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              ✓ Confirmar Troca
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
