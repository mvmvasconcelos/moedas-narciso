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
import type { Student, MaterialType, Class } from "@/lib/constants";
import { MATERIAL_LABELS, MATERIAL_TYPES } from "@/lib/constants";
import { DataService } from "@/lib/dataService";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CoinsIcon, PackageIcon, ArchiveIcon, DropletIcon, SaveIcon, UsersIcon, UserIcon } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StudentPhoto } from "@/components/alunos/StudentPhoto";

// Props for the component
interface ExchangeFormProps {
  materialType: MaterialType;
}

// Schema generation function
const createExchangeFormSchema = (materialType: MaterialType) => {
  return z.object({
    classId: z.string().min(1, "Selecione uma turma."),
    studentId: z.string().min(1, "Selecione um aluno."),
    [materialType]: z.coerce.number().min(1, `A quantidade de ${MATERIAL_LABELS[materialType].toLowerCase().replace(" (unidades)","")} deve ser maior que zero.`),
  });
};


export function ExchangeForm({ materialType }: ExchangeFormProps) {
  const { classes, students, registerExchange } = useAuth();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  /**
   * Ordena as turmas para garantir uma ordem pedagógica consistente:
   * 1. Turmas de "Pré" aparecem primeiro (Pré Manhã, depois Pré Tarde)
   * 2. Anos são ordenados numericamente (1º ano, 2º ano, etc.)
   * 3. Turmas sem padrão reconhecido ficam por último
   */
  const sortedClasses = useMemo(() => {
    if (!classes || classes.length === 0) return [];
    
    return [...classes].sort((a, b) => {
      const getOrderWeight = (className: string): number => {
        const nameLower = className.toLowerCase();
        
        // Os Prés têm prioridade máxima
        if (nameLower.includes('pré')) {
          return nameLower.includes('manhã') ? 1 : 2; // Pré Manhã vem antes de Pré Tarde
        }
        
        // Extrair o número do ano (1º, 2º, etc.)
        const yearMatch = className.match(/(\d+)º/);
        if (yearMatch && yearMatch[1]) {
          return 10 + parseInt(yearMatch[1], 10); // 1º ano = 11, 2º ano = 12, etc.
        }
        
        // Se não conseguir determinar, coloca no final
        return 100;
      };
      
      return getOrderWeight(a.name) - getOrderWeight(b.name);
    });
  }, [classes]);

  const currentSchema = createExchangeFormSchema(materialType);
  type ExchangeFormValues = z.infer<typeof currentSchema>;

  const form = useForm<ExchangeFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      classId: "",
      studentId: "",
      [materialType]: 0,
    },
  });

  const watchedStudentId = form.watch("studentId");
  const watchedMaterialQuantity = form.watch(materialType);

  useEffect(() => {
    if (selectedClass) {
      // Verificar quais alunos têm essa classe
      const matchingStudents = students.filter(s => s.className === selectedClass);
      
      if (matchingStudents.length === 0) {
        // Se não encontrar alunos com o nome exato, buscar por correspondência parcial
        const studentsWithSimilarClass = students.filter(
          s => s.className && s.className.includes(selectedClass) || 
               selectedClass.includes(s.className)
        );
        
        // Se encontrar alunos com correspondência parcial, usá-los
        if (studentsWithSimilarClass.length > 0) {
          setFilteredStudents(studentsWithSimilarClass);
        } else {
          setFilteredStudents([]);
        }
      } else {
        // Se encontrar alunos com correspondência exata, usá-los
        setFilteredStudents(matchingStudents);
      }
      
      // Reset student selection and material quantity when class changes
      form.setValue("studentId", "", { shouldValidate: true });
      setSelectedStudent(null);
      form.setValue(materialType, 0, {shouldValidate: true});
    } else {
      setFilteredStudents([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, students, form, materialType]); // Added form and materialType to dependencies

  // Atualizar o estudante selecionado quando watchedStudentId muda ou quando há mudanças nos estudantes
  useEffect(() => {
    if (watchedStudentId) {
      const student = students.find(s => s.id === watchedStudentId);
      setSelectedStudent(student || null);
    } else {
      setSelectedStudent(null);
    }
  }, [watchedStudentId, students]);
  
  // Efeito adicional para garantir que o estudante selecionado esteja sempre atualizado
  useEffect(() => {
    if (selectedStudent) {
      const currentStudentData = students.find(s => s.id === selectedStudent.id);
      if (currentStudentData && JSON.stringify(currentStudentData) !== JSON.stringify(selectedStudent)) {
        setSelectedStudent(currentStudentData);
      }
    }
  }, [students, selectedStudent]);

  function handleClassSelect(className: string) {
    if (selectedClass === className) { 
      setSelectedClass(null);
      form.setValue("classId", "", { shouldValidate: true });
      form.setValue("studentId", ""); 
      setSelectedStudent(null); 
      form.setValue(materialType, 0);
    } else { 
      setSelectedClass(className);
      form.setValue("classId", className, { shouldValidate: true });
      form.setValue("studentId", ""); 
      setSelectedStudent(null); 
      form.setValue(materialType, 0); 
    }
  }

  function handleStudentSelect(studentId: string) {
    if (watchedStudentId === studentId) { 
        form.setValue("studentId", "", { shouldValidate: true });
        setSelectedStudent(null); // Explicitly set selectedStudent to null
        form.setValue(materialType, 0, {shouldValidate: true});
    } else { 
        form.setValue("studentId", studentId, { shouldValidate: true });
        const student = students.find(s => s.id === studentId);
        setSelectedStudent(student || null); // Explicitly set selectedStudent
        form.setValue(materialType, 0, {shouldValidate: true}); 
    }
  }



  // Função para processar a submissão do formulário
  const processSubmit = async () => {
    try {
      if (!selectedStudent || !selectedStudent.id) return;
      
      const material = materialType as "tampas" | "latas" | "oleo";
      const quantity = watchedMaterialQuantity as number;
      
      if (!material || !quantity || quantity <= 0) {
        toast({
          variant: "destructive",
          title: "Quantidade inválida",
          description: `A quantidade de ${MATERIAL_LABELS[material].toLowerCase().replace(" (unidades)","")} deve ser maior que zero.`
        });
        return;
      }

      // Chamar a função de registro do contexto de autenticação e verificar sucesso
      const success = await registerExchange(selectedStudent.id, material, quantity);
      
      if (!success) {
        throw new Error("Falha ao registrar a troca no sistema");
      }

      toast({
        title: "Troca registrada!",
        description: `${quantity} ${MATERIAL_LABELS[material].toLowerCase()} de ${selectedStudent.name} registrados com sucesso.`,
      });
      
      // Resetar o valor do campo de material
      form.setValue(material, 0, {shouldValidate: true}); 

      // Atualizar dados do aluno
      const updatedStudentData = students.find(s => s.id === selectedStudent.id);
      if (updatedStudentData) {
        setSelectedStudent(updatedStudentData);
      }
    } catch (error) {
      // Mostrar mensagem de erro para o usuário com detalhes quando disponível
      let errorMessage = "Ocorreu um erro ao tentar registrar a troca. Tente novamente.";
      
      // Verificar se é um erro do Supabase com detalhes adicionais
      if (error instanceof Error && error.message) {
        if (error.message.includes("not-authorized")) {
          errorMessage = "Você não tem permissão para registrar trocas.";
        } else if (error.message.includes("student-not-found")) {
          errorMessage = "Aluno não encontrado no sistema.";
        } else if (error.message.includes("database")) {
          errorMessage = "Erro de conexão com o banco de dados. Tente novamente em alguns instantes.";
        }
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao registrar troca",
        description: errorMessage,
      });
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processSubmit();
  }

  const MaterialIcon =
    materialType === MATERIAL_TYPES.LIDS ? PackageIcon :
    materialType === MATERIAL_TYPES.CANS ? ArchiveIcon :
    DropletIcon;

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
    if (!selectedStudent || 
        typeof watchedMaterialQuantity !== 'number' || 
        watchedMaterialQuantity <= 0) {
      return 0;
    }
    
    const unitsPerCoin = conversionRates[materialType];
    const currentPendingForMaterial = selectedStudent.pendingExchanges?.[materialType] || 0;
    const totalPendingAfterContribution = currentPendingForMaterial + watchedMaterialQuantity;
    
    return Math.floor(totalPendingAfterContribution / unitsPerCoin) - 
           Math.floor(currentPendingForMaterial / unitsPerCoin);
  }, [selectedStudent, watchedMaterialQuantity, materialType]);

  return (
    <Card className="w-full shadow-xl"> {/* Removed max-w-2xl and mx-auto */}
      <Form {...form}>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            {/* Formulário modificado para usar handleSubmit diretamente */}
            <div>
              <FormLabel>Turma</FormLabel>
              <FormField
                control={form.control}
                name="classId"
                render={() => ( <FormItem><FormMessage className="mt-1 mb-2 text-xs" /></FormItem>)}
              />
              {/* Contêiner para o grid de todas as turmas (visível se NENHUMA turma selecionada) */}
              <div
                className={cn(
                  "grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1 transition-all duration-500 ease-in-out overflow-hidden",
                  selectedClass ? "opacity-0 max-h-0 invisible" : "opacity-100 max-h-[500px] visible"
                )}
              >
                {sortedClasses.map((cls) => (
                  <Button
                    key={cls.id}
                    type="button"
                    variant={"outline"}
                    onClick={() => handleClassSelect(cls.name)}
                    className={cn(
                      "w-full h-auto py-2 px-1.5 flex flex-col items-center whitespace-normal text-center leading-snug",
                       "hover:bg-primary hover:text-primary-foreground"
                    )}
                  >
                    <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 mb-1 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{cls.name}</span>
                  </Button>
                ))}
              </div>

              {/* Contêiner para o botão da turma selecionada (visível se UMA turma ESTÁ selecionada) */}
              <div
                className={cn(
                  "flex justify-center mt-1 transition-all duration-500 ease-in-out overflow-hidden",
                  selectedClass ? "opacity-100 max-h-40 visible" : "opacity-0 max-h-0 invisible"
                )}
              >
                {selectedClass && sortedClasses.find(cls => cls.name === selectedClass) && (
                  <Button
                    key={sortedClasses.find(cls => cls.name === selectedClass)!.id} 
                    type="button"
                    variant="destructive"
                    onClick={() => handleClassSelect(selectedClass)} 
                    className={cn(
                      "w-full max-w-xs sm:max-w-sm h-auto py-3 px-4 flex flex-col items-center whitespace-normal text-center leading-snug"
                    )}
                  >
                    <UsersIcon className="h-5 w-5 mb-1 flex-shrink-0" />
                    <span className="text-sm">{selectedClass}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Container para Seleção de Aluno */}
            <div
              className={cn(
                "mt-4 transition-all duration-500 ease-in-out",
                selectedClass ? "opacity-100 max-h-[1000px] visible" : "opacity-0 max-h-0 invisible"
              )}
            >
              <FormLabel>Aluno</FormLabel>
              <FormField
                control={form.control}
                name="studentId"
                render={() => ( <FormItem><FormMessage className="mt-1 mb-2 text-xs" /></FormItem>)}
              />

              {/* Grid de Alunos (visível se NENHUM aluno selecionado AINDA) */}
              <div
                className={cn(
                  "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-1 transition-all duration-500 ease-in-out overflow-hidden",
                  selectedClass && !selectedStudent ? "opacity-100 max-h-[500px] visible" : "opacity-0 max-h-0 invisible"
                )}
              >
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((std) => (
                    <Button
                      key={std.id}
                      type="button"
                      variant={"outline"}
                      onClick={() => handleStudentSelect(std.id)}
                      className={cn(
                        "w-full h-auto py-2 px-1.5 flex flex-col items-center whitespace-normal text-center leading-tight",
                        "hover:bg-primary hover:text-primary-foreground"
                      )}
                    >
                      <StudentPhoto 
                        photoUrl={std.photo_url}
                        name={std.name}
                        size="md"
                        className="mb-1 flex-shrink-0"
                      />
                      <span className="text-xs">{std.name}</span>
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground mt-2 col-span-full">Nenhum aluno encontrado nesta turma.</p>
                )}
              </div>

              {/* Botão do Aluno Selecionado (visível se UM aluno ESTÁ selecionado) */}
              <div
                className={cn(
                  "flex justify-center mt-1 transition-all duration-500 ease-in-out overflow-hidden",
                  selectedClass && selectedStudent ? "opacity-100 max-h-40 visible" : "opacity-0 max-h-0 invisible"
                )}
              >
                {selectedStudent && ( 
                  <Button
                    key={selectedStudent.id} 
                    type="button"
                    variant="destructive"
                    onClick={() => handleStudentSelect(selectedStudent.id)} 
                    className={cn(
                      "w-full max-w-xs sm:max-w-sm h-auto py-3 px-4 flex flex-col items-center whitespace-normal text-center leading-snug"
                    )}
                  >
                    <StudentPhoto 
                      photoUrl={selectedStudent.photo_url}
                      name={selectedStudent.name}
                      size="lg"
                      className="mb-1 flex-shrink-0"
                    />
                    <span className="text-sm">{selectedStudent.name}</span>
                  </Button>
                )}
              </div>
            </div>
            
            {/* Seção de Detalhes e Entrada de Material (aparece se um aluno estiver selecionado) */}
            <div
              className={cn(
                "space-y-6 pt-6 transition-all duration-500 ease-in-out overflow-hidden",
                selectedStudent ? "opacity-100 max-h-[1000px] visible" : "opacity-0 max-h-0 invisible"
              )}
            >
              {selectedStudent && (
                <>
                  <div className="p-4 border rounded-md bg-card shadow-sm">
                    <h3 className="text-sm font-medium text-muted-foreground">Saldo Atual de {selectedStudent.name}:</h3>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-2xl font-bold text-primary flex items-center">
                        <CoinsIcon className="mr-2 h-6 w-6" /> {selectedStudent.narcisoCoins || 0}
                        <span className="text-lg ml-1">Moedas no total</span>
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center">
                        <MaterialIcon className="mr-1 h-3 w-3" />
                        Saldo pendente de {MATERIAL_LABELS[materialType].toLowerCase().replace(" (unidades)","")}: {selectedStudent.pendingExchanges?.[materialType] || 0}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-lg font-medium">Adicionar {MATERIAL_LABELS[materialType].replace(" (unidades)","")}:</h3>
                      <FormField
                        control={form.control}
                        name={materialType}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center sr-only">
                              <MaterialIcon className="mr-2 h-4 w-4 text-primary" />
                              {MATERIAL_LABELS[materialType]}
                            </FormLabel>
                            <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Quantidade"
                                  {...field}
                                  onChange={e => field.onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                  value={field.value === undefined || field.value === null || isNaN(Number(field.value)) ? 0 : Number(field.value)}
                                  className="text-center text-xl h-12"
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                      />
                       {selectedStudent && typeof watchedMaterialQuantity === 'number' && watchedMaterialQuantity > 0 && (
                        <div className="mt-1 text-xs text-center text-primary font-medium">
                          <CoinsIcon className="inline-block mr-1 h-3 w-3" />
                          <span>+{ coinsFromCurrentContribution } Moedas Narciso por esta troca</span>
                        </div>
                      )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
          {/* Footer com Botão de Submissão (aparece se um aluno estiver selecionado) */}
          <CardFooter
            className={cn(
              "justify-center pt-6 transition-all duration-500 ease-in-out overflow-hidden",
               selectedStudent ? "opacity-100 max-h-40 visible" : "opacity-0 max-h-0 invisible"
            )}
          >
            {selectedStudent && ( 
              <Button
                type="submit"
                className="w-full sm:w-auto"
                size="lg"
                disabled={form.formState.isSubmitting || !watchedMaterialQuantity || (typeof watchedMaterialQuantity === 'number' && watchedMaterialQuantity <= 0)}
              >
                <SaveIcon className="mr-2 h-5 w-5" />
                Registrar {MATERIAL_LABELS[materialType].replace(" (unidades)","")}
              </Button>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

