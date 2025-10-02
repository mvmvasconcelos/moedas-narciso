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
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import type { Student, MaterialType, UserRole } from "@/lib/constants";
import { MATERIAL_LABELS, MATERIAL_TYPES } from "@/lib/constants";
import { DataService } from "@/lib/dataService";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CoinsIcon, PackageIcon, ArchiveIcon, DropletIcon, SaveIcon, AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { StudentPhoto } from "@/components/alunos/StudentPhoto";

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  materialType: MaterialType;
}

// Schema para validação do formulário - sempre usa o padrão simplificado (teacher)
const createExchangeFormSchema = (materialType: MaterialType) => {
  return z.object({
    [materialType]: z.coerce.number().min(1, `A quantidade de ${MATERIAL_LABELS[materialType].toLowerCase().replace(" (unidades)", "")} deve ser maior que zero.`),
  });
};

export function ExchangeModal({ isOpen, onClose, student, materialType }: ExchangeModalProps) {
  const { students, registerExchange, userRole } = useAuth();
  const { toast } = useToast();
  const [currentStudent, setCurrentStudent] = useState<Student>(student);

  // Estados para controlar o conteúdo do modal
  const [modalState, setModalState] = useState<'form' | 'confirmation' | 'error'>('form');
  const [errorData, setErrorData] = useState({
    title: "",
    description: ""
  });

  const [confirmationData, setConfirmationData] = useState<{
    materialName: string;
    materialQuantity: number;
    coinsToReceive: number;
    textoTroca?: string;
    textoSobra?: string;
  }>({
    materialName: "",
    materialQuantity: 0,
    coinsToReceive: 0,
    textoTroca: ""
  });

  const [successDialog, setSuccessDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
  }>({ isOpen: false, title: '', description: '' });

  // Estado para indicar que a confirmação está sendo processada
  const [isConfirming, setIsConfirming] = useState(false);

  const currentSchema = createExchangeFormSchema(materialType);
  type ExchangeFormValues = z.infer<typeof currentSchema>;

  // Valores padrão - sempre usa o padrão simplificado (teacher)
  const getDefaultValues = () => {
    return {
      [materialType]: 0,
    };
  };

  const form = useForm<ExchangeFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: getDefaultValues(),
  });

  const watchedMaterialQuantity = form.watch(materialType);

  // Funções para controlar estados do modal
  const showErrorState = (title: string, description: string) => {
    setErrorData({
      title,
      description
    });
    setModalState('error');
  };

  const showSuccessDialog = (title: string, description: string) => {
    setSuccessDialog({
      isOpen: true,
      title,
      description,
    });
  };
  const closeSuccessDialog = () => {
    setSuccessDialog({ isOpen: false, title: '', description: '' });
  };

  const showConfirmationState = (materialQuantity: number, coinsToReceive: number, materialName: string) => {
    const currentPending = currentStudent.pendingExchanges?.[materialType] || 0;
    const unitsPerCoin = conversionRates[materialType];
    let textoTroca = '';
    const faltaParaMoeda = unitsPerCoin - (currentPending % unitsPerCoin);
    const total = currentPending + materialQuantity;
    const moedasGeradas = Math.floor(total / unitsPerCoin) - Math.floor(currentPending / unitsPerCoin);
    const sobraFinal = total % unitsPerCoin;
    let usadoDaSobra = 0;
    // Caso 1: Não gera moedas
    if (moedasGeradas <= 0) {
      textoTroca = `${materialQuantity} ${materialName} (não gera moedas)`;
      // Observação sobre sobra
      var textoSobra = `vai sobrar ${sobraFinal} ${materialName} para a próxima troca`;
    } else if (
      currentPending > 0 &&
      faltaParaMoeda < unitsPerCoin &&
      faltaParaMoeda <= materialQuantity
    ) {
      // Usa sobra para gerar moeda
      usadoDaSobra = Math.min(faltaParaMoeda, currentPending, materialQuantity);
      textoTroca = `${materialQuantity} ${materialName} mais ${usadoDaSobra} da sobra por ${coinsToReceive} ${coinsToReceive === 1 ? 'moeda' : 'moedas'}?`;
      var textoSobra = `vai ficar sobrando ${sobraFinal} ${materialName} para a próxima troca`;
    } else {
      // Não usa sobra para gerar moeda
      textoTroca = `${materialQuantity} ${materialName} por ${coinsToReceive} ${coinsToReceive === 1 ? 'moeda' : 'moedas'}?`;
      var textoSobra = `vai ficar sobrando ${sobraFinal} ${materialName} para a próxima troca`;
    }
    setConfirmationData({
      materialQuantity,
      coinsToReceive,
      materialName,
      textoTroca,
      textoSobra
    });
    setModalState('confirmation');
  };

  // Retorna pronome (Ela/Ele) quando o gênero for feminino/masculino, ou o nome como fallback
  const getPronomeOuNome = (s: Student) => {
    if (!s) return '';
    return s.gender === 'feminino' ? 'Ela' : s.gender === 'masculino' ? 'Ele' : s.name;
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

  // Função para processar a submissão do formulário
  const processSubmit = async () => {
    try {
      const material = materialType as "tampas" | "latas" | "oleo";
      const quantity = watchedMaterialQuantity as number;

      if (!material || !quantity || quantity <= 0) {
        showErrorState(
          "Quantidade inválida",
          `A quantidade de ${MATERIAL_LABELS[material].toLowerCase().replace(" (unidades)", "")} deve ser maior que zero.`
        );
        return;
      }

      // Ir direto para confirmação (comportamento padrão)
      const materialName = MATERIAL_LABELS[material].toLowerCase().replace(" (unidades)", "").replace(" (litros)", "");
      const coinsFromThisTrade = coinsFromCurrentContribution;
      showConfirmationState(quantity, coinsFromThisTrade, materialName);

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

      showErrorState(
        "Erro ao registrar troca",
        errorMessage
      );
      // Garantir que o estado de processamento seja limpo em caso de erro
      setIsConfirming(false);
    }
  };

  // Função para confirmar e executar a troca
  const confirmAndExecuteTrade = async () => {
    try {
      const material = materialType as "tampas" | "latas" | "oleo";
      const quantity = watchedMaterialQuantity as number;

      // Indicar que o sistema está processando a confirmação
      setIsConfirming(true);

      // Executar o registro da troca (mantendo a janela de confirmação aberta)
      const success = await registerExchange(currentStudent.id, material, quantity);

      if (!success) {
        throw new Error("Falha ao registrar a troca no sistema");
      }

      // Usar o cálculo correto já utilizado no sistema
      const moedasRecebidas = coinsFromCurrentContribution;
      const novoSaldo = (currentStudent.narcisoCoins || 0) + moedasRecebidas;
      const pronomeOuNome = getPronomeOuNome(currentStudent);
      showSuccessDialog(
        'Troca Realizada!',
        `🎉 Parabéns! Troca registrada com sucesso!\n\n${quantity} ${MATERIAL_LABELS[material].toLowerCase()} de ${currentStudent.name} foram registrados.\n\n${moedasRecebidas === 1 ? `${pronomeOuNome} recebeu 1 moeda.` : `${pronomeOuNome} recebeu ${moedasRecebidas} moedas.`}\nNovo saldo: ${novoSaldo} moedas.`
      );


      // Resetar todos os campos
      form.reset(getDefaultValues());  // Depois que processou, fechar a confirmação (voltar ao formulário) e abrir diálogo de sucesso
  setIsConfirming(false);
  setModalState('form');

      // Atualizar dados do aluno
      const updatedStudentData = students.find(s => s.id === currentStudent.id);
      if (updatedStudentData) {
        setCurrentStudent(updatedStudentData);
      }

      // Fechar o modal principal após sucesso (ao fechar o dialog)
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

      showErrorState(
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
      form.reset(getDefaultValues());

      // Resetar estado do modal
      setModalState('form');
      setErrorData({ title: '', description: '' });
      setConfirmationData({ materialName: '', materialQuantity: 0, coinsToReceive: 0 });
      setSuccessDialog({ isOpen: false, title: '', description: '' });
    }
  }, [isOpen, form, materialType]);

  const MaterialIcon = 
      materialType === MATERIAL_TYPES.LIDS ? PackageIcon :
      materialType === MATERIAL_TYPES.CANS ? ArchiveIcon :
        DropletIcon;

  // Função para obter classes de cor baseadas no tipo de material
  const getMaterialColors = (material: MaterialType) => {
    switch (material) {
      case MATERIAL_TYPES.LIDS:
        return {
          headerBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
          headerText: 'text-white',
          iconColor: 'text-blue-100',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          borderColor: 'border-blue-200',
          textAccent: 'text-blue-700'
        };
      case MATERIAL_TYPES.CANS:
        return {
          headerBg: 'bg-gradient-to-r from-gray-500 to-gray-600',
          headerText: 'text-white',
          iconColor: 'text-gray-100',
          buttonBg: 'bg-gray-600 hover:bg-gray-700',
          borderColor: 'border-gray-300',
          textAccent: 'text-gray-700'
        };
      case MATERIAL_TYPES.OIL:
        return {
          headerBg: 'bg-gradient-to-r from-orange-500 to-orange-600',
          headerText: 'text-white',
          iconColor: 'text-orange-100',
          buttonBg: 'bg-orange-600 hover:bg-orange-700',
          borderColor: 'border-orange-200',
          textAccent: 'text-orange-700'
        };
      default:
        return {
          headerBg: 'bg-gradient-to-r from-primary to-primary',
          headerText: 'text-white',
          iconColor: 'text-white',
          buttonBg: 'bg-primary hover:bg-primary/90',
          borderColor: 'border-border',
          textAccent: 'text-primary'
        };
    }
  };

  const materialColors = getMaterialColors(materialType);  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {modalState === 'form' && (
            <>
              <DialogHeader className={`pb-3 px-6 py-4 -mx-6 -mt-6 mb-6 rounded-t-lg ${materialColors.headerBg}`}>
                <DialogTitle className={`flex items-center ${materialColors.headerText}`}>
                  <MaterialIcon className={`mr-2 h-5 w-5 ${materialColors.iconColor}`} />
                  Trocar {MATERIAL_LABELS[materialType].replace(" (unidades)", "")}
                </DialogTitle>
                <DialogDescription className={`text-sm break-words ${materialColors.headerText} opacity-90`}>
                  Registre a quantidade de <span className="font-medium">{MATERIAL_LABELS[materialType].toLowerCase()}</span> trazida por <span className="font-medium">{student.name}</span>.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Modal de Sucesso */}
                  <AlertDialog open={successDialog.isOpen} onOpenChange={(open) => { if (!open) { closeSuccessDialog(); onClose(); } }}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-green-700">{successDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription className="whitespace-pre-line">
                          {successDialog.description}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogAction onClick={() => { closeSuccessDialog(); onClose(); }}>
                          OK
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Informações do Aluno */}
                  <div className="flex items-center space-x-3 p-3 border rounded-md bg-card">
                    <StudentPhoto
                      photoUrl={currentStudent.photo_url}
                      name={currentStudent.name}
                      size="lg"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base break-words leading-tight">{currentStudent.name}</h3>
                      <p className="text-xs text-muted-foreground mb-1">{currentStudent.className}</p>
                      <div className="flex items-center mb-2">
                        <CoinsIcon className="mr-1 h-3 w-3 text-primary" />
                        <span className="text-xs font-medium">{currentStudent.narcisoCoins || 0} Moedas</span>
                      </div>
                      <div className={`p-2 border rounded-md ${materialColors.borderColor}`} style={{
                        backgroundColor: materialType === MATERIAL_TYPES.LIDS ? '#eff6ff' : 
                                       materialType === MATERIAL_TYPES.CANS ? '#f9fafb' : 
                                       '#fff7ed'
                      }}>
                        <div className="text-center">
                          <div className={`text-xs font-medium ${materialColors.textAccent} flex items-center justify-center`}>
                            <MaterialIcon className={`mr-1 h-3 w-3 ${materialColors.textAccent}`} />
                            {MATERIAL_LABELS[materialType].toLowerCase().replace(" (unidades)", "")} sobrando
                          </div>
                          <div className={`text-base font-bold ${materialColors.textAccent} mt-1`}>
                            {currentStudent.pendingExchanges?.[materialType] || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Campos de Quantidade */}
                  <div className="space-y-3">
                    {/* Campo de Quantidade Principal */}
                    <FormField
                      control={form.control}
                      name={materialType}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-sm font-semibold">
                            <MaterialIcon className="mr-2 h-4 w-4 text-primary" />
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
                              className="text-center text-xl h-12 font-bold border-2"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                  </div>

                  {/* Botões */}
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="px-4"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting || !watchedMaterialQuantity || (typeof watchedMaterialQuantity === 'number' && watchedMaterialQuantity <= 0)}
                      className={`px-4 ${materialColors.buttonBg} text-white border-0`}
                    >
                      <SaveIcon className="mr-2 h-4 w-4" />
                      Registrar
                    </Button>
                  </div>
                </form>
              </Form>
            </>
          )}

          {modalState === 'confirmation' && (
            <>
              <DialogHeader className={`pb-3 px-6 py-4 -mx-6 -mt-6 mb-6 rounded-t-lg ${materialColors.headerBg}`}>
                <DialogTitle className={`flex items-center ${materialColors.headerText} text-xl`}>
                  <AlertCircle className={`h-8 w-8 mr-3 ${materialColors.iconColor}`} />
                  Confirmar troca de {MATERIAL_LABELS[materialType].toLowerCase()}
                </DialogTitle>
                <DialogDescription className={`${materialColors.headerText} opacity-90`}>
                  Confirme os detalhes da troca antes de prosseguir.
                </DialogDescription>
              </DialogHeader>
              <div className="text-base text-gray-700 leading-relaxed pt-2">
                <div className="space-y-2">
                  <p>
                    <strong>Tem certeza que deseja confirmar a troca de:</strong>
                  </p>
                  <div className={`p-3 rounded-md border ${materialColors.borderColor}`} style={{
                    backgroundColor: materialType === MATERIAL_TYPES.LIDS ? '#eff6ff' : 
                                   materialType === MATERIAL_TYPES.CANS ? '#f9fafb' : 
                                   '#fff7ed'
                  }}>
                    <div>
                      <p className="text-lg">
                        {confirmationData.textoTroca}
                      </p>
                      {confirmationData.textoSobra && (
                        <p className="text-xs text-gray-600 mt-2">(
                          {confirmationData.textoSobra}
                        )</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setModalState('form')}
                  className="px-6"
                  disabled={isConfirming}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmAndExecuteTrade}
                  className={`${materialColors.buttonBg} text-white px-6 transition-transform duration-150 border-0 ${isConfirming ? 'animate-pulse transform scale-95 opacity-90' : ''}`}
                  disabled={isConfirming}
                  aria-busy={isConfirming}
                  aria-disabled={isConfirming}
                >
                  {isConfirming ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-4 w-4" /> Processando...
                    </span>
                  ) : (
                    '✓ Confirmar Troca'
                  )}
                </Button>
              </div>
            </>
          )}

          {modalState === 'error' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center text-red-600 text-xl">
                  <AlertCircle className="h-8 w-8 mr-3" />
                  {errorData.title || "Erro na Troca"}
                </DialogTitle>
                <DialogDescription className="text-base text-gray-700 leading-relaxed pt-2">
                  {errorData.description}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setModalState('form')}
                  className="bg-red-600 hover:bg-red-700 text-white px-6"
                >
                  Entendido
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
