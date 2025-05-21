
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Student } from "@/lib/constants";
import { MATERIAL_TYPES, MATERIAL_LABELS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CoinsIcon, PackageIcon, ArchiveIcon, DropletIcon, SaveIcon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const contributionFormSchema = z.object({
  classId: z.string().min(1, "Selecione uma turma."),
  studentId: z.string().min(1, "Selecione um aluno."),
  [MATERIAL_TYPES.LIDS]: z.coerce.number().min(0).optional(),
  [MATERIAL_TYPES.CANS]: z.coerce.number().min(0).optional(),
  [MATERIAL_TYPES.OIL]: z.coerce.number().min(0).optional(),
}).refine(data => data.tampas || data.latas || data.oleo, {
  message: "Ao menos um tipo de material deve ser preenchido.",
  path: ["tampas"],
});


type ContributionFormValues = z.infer<typeof contributionFormSchema>;

export function ContributionForm() {
  const { classes, students, addContribution } = useAuth();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      classId: "",
      studentId: "",
      [MATERIAL_TYPES.LIDS]: 0,
      [MATERIAL_TYPES.CANS]: 0,
      [MATERIAL_TYPES.OIL]: 0,
    },
  });

  useEffect(() => {
    if (selectedClass) {
      setFilteredStudents(students.filter(s => s.className === selectedClass));
      form.setValue("studentId", ""); 
      setSelectedStudent(null);
    } else {
      setFilteredStudents([]);
    }
  }, [selectedClass, students, form]);

  useEffect(() => {
    const studentId = form.watch("studentId");
    if (studentId) {
      setSelectedStudent(students.find(s => s.id === studentId) || null);
    } else {
      setSelectedStudent(null);
    }
  }, [form.watch("studentId"), students]);

  function handleClassSelect(className: string) {
    setSelectedClass(className);
    form.setValue("classId", className, { shouldValidate: true });
  }

  function onSubmit(data: ContributionFormValues) {
    if (data.studentId) {
      let contributionMade = false;
      if (data.tampas && data.tampas > 0) {
        addContribution(data.studentId, MATERIAL_TYPES.LIDS, data.tampas);
        contributionMade = true;
      }
      if (data.latas && data.latas > 0) {
        addContribution(data.studentId, MATERIAL_TYPES.CANS, data.latas);
        contributionMade = true;
      }
      if (data.oleo && data.oleo > 0) {
        addContribution(data.studentId, MATERIAL_TYPES.OIL, data.oleo);
        contributionMade = true;
      }

      if (contributionMade) {
          toast({
            title: "Sucesso!",
            description: `Contribuições de ${selectedStudent?.name || 'aluno'} registradas.`,
          });
          form.reset({ 
            classId: data.classId, 
            studentId: data.studentId, 
            [MATERIAL_TYPES.LIDS]: 0,
            [MATERIAL_TYPES.CANS]: 0,
            [MATERIAL_TYPES.OIL]: 0,
          });
          // Re-fetch student data to update displayed balance
          setSelectedStudent(students.find(s => s.id === data.studentId) || null);

      } else {
         toast({
            title: "Nenhuma Contribuição",
            description: "Nenhum valor de contribuição foi inserido.",
            variant: "destructive",
          });
      }
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Registrar Contribuições</CardTitle>
        <CardDescription>
          Selecione a turma, o aluno e insira a quantidade de materiais recicláveis.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div>
              <FormLabel>Turma</FormLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {classes.map((cls) => (
                  <Button
                    key={cls.id}
                    type="button"
                    variant={selectedClass === cls.name ? "default" : "outline"}
                    onClick={() => handleClassSelect(cls.name)}
                    className="w-full h-auto py-3 px-2 flex flex-col items-center" // Changed to flex-col and items-center
                  >
                    <UsersIcon className="h-5 w-5 mb-1" /> {/* Adjusted icon size and added margin-bottom */}
                    <span className="whitespace-normal text-center leading-snug text-xs sm:text-sm">{cls.name}</span>
                  </Button>
                ))}
              </div>
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => ( <FormItem><FormMessage className="mt-2" /></FormItem>)}
              />
            </div>
            
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aluno</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    disabled={!selectedClass}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredStudents.map((std) => (
                        <SelectItem key={std.id} value={std.id}>
                          {std.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedStudent && (
              <div className="p-4 border rounded-md bg-muted/50">
                <h3 className="text-sm font-medium text-muted-foreground">Saldo Atual de {selectedStudent.name}:</h3>
                <p className="text-2xl font-bold text-primary flex items-center">
                  <CoinsIcon className="mr-2 h-6 w-6" /> {selectedStudent.narcisoCoins} Moedas Narciso
                </p>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Materiais Coletados:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                    control={form.control}
                    name={MATERIAL_TYPES.LIDS}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><PackageIcon className="mr-2 h-4 w-4 text-primary" />{MATERIAL_LABELS.tampas}</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Quantidade" {...field} min="0" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name={MATERIAL_TYPES.CANS}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><ArchiveIcon className="mr-2 h-4 w-4 text-primary" />{MATERIAL_LABELS.latas}</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Quantidade" {...field} min="0" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name={MATERIAL_TYPES.OIL}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><DropletIcon className="mr-2 h-4 w-4 text-primary" />{MATERIAL_LABELS.oleo}</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Quantidade" {...field} min="0" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 {form.formState.errors.tampas && ( // Check for the specific error path defined in refine
                    <p className="text-sm font-medium text-destructive">{form.formState.errors.tampas.message}</p>
                )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full md:w-auto ml-auto" size="lg" disabled={!selectedStudent || form.formState.isSubmitting}>
              <SaveIcon className="mr-2 h-5 w-5" />
              Registrar Contribuição
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

