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
import type { Student, MaterialType } from "@/lib/constants";
import { MATERIAL_LABELS, MATERIAL_TYPES, MATERIAL_UNITS_PER_COIN } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CoinsIcon, PackageIcon, ArchiveIcon, DropletIcon, SaveIcon, UsersIcon, UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Props for the component
interface ContributionFormProps {
  materialType: MaterialType;
}

// Schema generation function
const createContributionFormSchema = (materialType: MaterialType) => {
  return z.object({
    classId: z.string().min(1, "Selecione uma turma."),
    studentId: z.string().min(1, "Selecione um aluno."),
    [materialType]: z.coerce.number().min(1, `A quantidade de ${MATERIAL_LABELS[materialType].toLowerCase().replace(" (unidades)","")} deve ser maior que zero.`),
    ...(materialType !== MATERIAL_TYPES.LIDS && { [MATERIAL_TYPES.LIDS]: z.coerce.number().optional() }),
    ...(materialType !== MATERIAL_TYPES.CANS && { [MATERIAL_TYPES.CANS]: z.coerce.number().optional() }),
    ...(materialType !== MATERIAL_TYPES.OIL && { [MATERIAL_TYPES.OIL]: z.coerce.number().optional() }),
  });
};


export function ContributionForm({ materialType }: ContributionFormProps) {
  const { classes, students, addContribution } = useAuth();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const currentSchema = createContributionFormSchema(materialType);
  type ContributionFormValues = z.infer<typeof currentSchema>;

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      classId: "",
      studentId: "",
      [materialType]: 0,
      ...(materialType !== MATERIAL_TYPES.LIDS && { [MATERIAL_TYPES.LIDS]: 0 }),
      ...(materialType !== MATERIAL_TYPES.CANS && { [MATERIAL_TYPES.CANS]: 0 }),
      ...(materialType !== MATERIAL_TYPES.OIL && { [MATERIAL_TYPES.OIL]: 0 }),
    },
  });

  const watchedStudentId = form.watch("studentId");
  const watchedMaterialQuantity = form.watch(materialType);

  useEffect(() => {
    if (selectedClass) {
      setFilteredStudents(students.filter(s => s.className === selectedClass));
      form.setValue("studentId", ""); // Reset student selection
      setSelectedStudent(null);
    } else {
      setFilteredStudents([]);
      form.setValue("studentId", "");
      setSelectedStudent(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, students]); // form.setValue removed from deps to avoid loop

  useEffect(() => {
    if (watchedStudentId) {
      const student = students.find(s => s.id === watchedStudentId);
      setSelectedStudent(student || null);
    } else {
      setSelectedStudent(null);
    }
  }, [watchedStudentId, students]);

  useEffect(() => { // Reset form material quantity when student changes
    if (watchedStudentId){
        form.setValue(materialType, 0, { shouldValidate: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedStudentId]);


  function handleClassSelect(className: string) {
    setSelectedClass(className);
    form.setValue("classId", className, { shouldValidate: true });
    form.setValue("studentId", ""); // Also reset studentId field in form
    setSelectedStudent(null); // Reset student object
    form.setValue(materialType, 0); // Reset material quantity
  }

  function handleStudentSelect(studentId: string) {
    form.setValue("studentId", studentId, { shouldValidate: true });
    // form.setValue(materialType, 0); // Material quantity reset is now in useEffect
  }

  const adjustQuantity = (amount: number) => {
    const currentValue = Number(form.getValues(materialType)) || 0;
    let newValue = currentValue + amount;
    if (newValue < 0) newValue = 0;
    form.setValue(materialType, newValue, { shouldValidate: true });
  };

  const quantityButtons = [1, 5, 10, 50];

  function onSubmit(data: ContributionFormValues) {
    if (data.studentId && selectedStudent) {
      const quantity = data[materialType];
      if (quantity !== undefined && quantity > 0) {
        addContribution(data.studentId, materialType, quantity as number);
        toast({
          title: "Sucesso!",
          description: `${quantity} ${MATERIAL_LABELS[materialType].toLowerCase().replace(" (unidades)","")} de ${selectedStudent?.name || 'aluno'} registradas.`,
        });
        form.setValue(materialType, 0, {shouldValidate: true}); // Reset only material quantity

        // Update selectedStudent data locally to reflect new totals
        const updatedStudentData = students.find(s => s.id === data.studentId);
        if (updatedStudentData) {
          setSelectedStudent(updatedStudentData);
        }

      } else {
        form.setError(materialType, { type: "manual", message: `A quantidade de ${MATERIAL_LABELS[materialType].toLowerCase().replace(" (unidades)","")} deve ser maior que zero.` });
      }
    }
  }

  const MaterialIcon =
    materialType === MATERIAL_TYPES.LIDS ? PackageIcon :
    materialType === MATERIAL_TYPES.CANS ? ArchiveIcon :
    DropletIcon;

  let coinsFromCurrentContribution = 0;
  if (selectedStudent && watchedMaterialQuantity > 0 && MATERIAL_UNITS_PER_COIN[materialType]) {
    const unitsPerCoin = MATERIAL_UNITS_PER_COIN[materialType];
    const currentPendingForMaterial = selectedStudent.pendingContributions?.[materialType] || 0;
    const totalPendingAfterContribution = currentPendingForMaterial + watchedMaterialQuantity;
    coinsFromCurrentContribution = Math.floor(totalPendingAfterContribution / unitsPerCoin) - Math.floor(currentPendingForMaterial / unitsPerCoin);
  }


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            <div>
              <FormLabel>Turma</FormLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {classes.map((cls) => {
                  const isClassSelectedCurrently = selectedClass === cls.name;
                  return (
                    <Button
                      key={cls.id}
                      type="button"
                      variant={isClassSelectedCurrently ? "destructive" : "outline"}
                      onClick={() => handleClassSelect(cls.name)}
                      className={cn(
                        "w-full h-auto flex flex-col items-center whitespace-normal text-center leading-snug transition-all duration-200 ease-in-out",
                        !selectedClass && "py-3 px-2", // Larger padding when no class is selected
                        selectedClass && "py-2 px-1.5 sm:py-3 sm:px-2", // Smaller on mobile, revert on sm+ when class is selected
                        !isClassSelectedCurrently && "hover:bg-primary hover:text-primary-foreground"
                      )}
                    >
                      <UsersIcon className={cn(
                          "mb-1 flex-shrink-0 transition-all duration-200 ease-in-out",
                          !selectedClass && "h-5 w-5", // Larger icon when no class is selected
                          selectedClass && "h-4 w-4 sm:h-5 sm:w-5" // Smaller icon on mobile, revert on sm+
                      )} />
                      <span className={cn(
                        "transition-all duration-200 ease-in-out",
                        "text-xs sm:text-sm" // Consistent text size, visual change from padding/icon
                      )}>{cls.name}</span>
                    </Button>
                  );
                })}
              </div>
              <FormField
                control={form.control}
                name="classId"
                render={() => ( <FormItem><FormMessage className="mt-2" /></FormItem>)}
              />
            </div>

            {selectedClass && (
              <div>
                <FormLabel>Aluno</FormLabel>
                {filteredStudents.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                    {filteredStudents.map((std) => {
                      const isStudentSelected = watchedStudentId === std.id;
                      return (
                        <Button
                          key={std.id}
                          type="button"
                          variant={isStudentSelected ? "destructive" : "outline"}
                          onClick={() => handleStudentSelect(std.id)}
                           className={cn(
                            "w-full h-auto py-2 px-1.5 flex flex-col items-center whitespace-normal text-center leading-tight",
                            !isStudentSelected && "hover:bg-primary hover:text-primary-foreground"
                          )}
                        >
                          <UserIcon className="h-4 w-4 mb-1 flex-shrink-0" />
                          <span className="text-xs">{std.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">Nenhum aluno encontrado nesta turma.</p>
                )}
                <FormField
                  control={form.control}
                  name="studentId"
                  render={() => (<FormItem><FormMessage className="mt-2" /></FormItem>)}
                />
              </div>
            )}

            {selectedStudent && (
              <>
                <div className="p-4 border rounded-md bg-card shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground">Saldo Atual de {selectedStudent.name}:</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-2xl font-bold text-primary flex items-center">
                      <CoinsIcon className="mr-2 h-6 w-6" /> {selectedStudent.narcisoCoins || 0}
                      <span className="text-lg ml-1">Moedas</span>
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                      <MaterialIcon className="mr-1 h-3 w-3" />
                      Saldo pendente de {MATERIAL_LABELS[materialType].toLowerCase().replace(" (unidades)","")}: {selectedStudent.pendingContributions?.[materialType] || 0}
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
                        <span>+{ coinsFromCurrentContribution } Moedas Narciso por esta contribuição</span>
                      </div>
                    )}
                    <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-2">
                            {quantityButtons.map(val => (
                                <Button key={`add-${val}`} type="button" variant="outline" onClick={() => adjustQuantity(val)}>
                                    +{val}
                                </Button>
                            ))}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {quantityButtons.map(val => (
                                <Button key={`sub-${val}`} type="button" variant="outline" onClick={() => adjustQuantity(-val)}>
                                    -{val}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
              </>
            )}
          </CardContent>
          {selectedStudent && (
            <CardFooter className="justify-center pt-6">
              <Button
                type="submit"
                className="w-full sm:w-auto"
                size="lg"
                disabled={form.formState.isSubmitting || !watchedMaterialQuantity || (typeof watchedMaterialQuantity === 'number' && watchedMaterialQuantity <= 0)}
              >
                <SaveIcon className="mr-2 h-5 w-5" />
                Registrar {MATERIAL_LABELS[materialType].replace(" (unidades)","")}
              </Button>
            </CardFooter>
          )}
        </form>
      </Form>
    </Card>
  );
}

