
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
import type { Student, Class, GenderType } from "@/lib/constants";
import { GENDER_LABELS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

const studentFormSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
  className: z.string({ required_error: "Por favor, selecione uma turma." }),
  gender: z.enum(['masculino', 'feminino', 'outro', 'prefiroNaoInformar'], {
    required_error: "Por favor, selecione o gênero.",
  }),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  student?: Student | null; // For editing
  onSuccess: () => void;
}

export function StudentForm({ student, onSuccess }: StudentFormProps) {
  const { classes, addStudent, updateStudent } = useAuth();

  const defaultGender = student?.gender || (Object.keys(GENDER_LABELS)[3] as GenderType); // Default to 'prefiroNaoInformar'

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: student?.name || "",
      className: student?.className || "",
      gender: student?.gender || defaultGender,
    },
  });

  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name,
        className: student.className,
        gender: student.gender,
      });
    } else {
      form.reset({ name: "", className: "", gender: defaultGender });
    }
  }, [student, form, defaultGender]);

  function onSubmit(data: StudentFormValues) {
    if (student) {
      updateStudent({ ...student, ...data });
    } else {
      addStudent(data);
    }
    onSuccess();
    form.reset({ name: "", className: "", gender: defaultGender });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Aluno</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo do aluno" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="className"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Turma</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.name}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gênero</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gênero" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.keys(GENDER_LABELS) as GenderType[]).map((genderKey) => (
                    <SelectItem key={genderKey} value={genderKey}>
                      {GENDER_LABELS[genderKey]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          {student ? "Salvar Alterações" : "Adicionar Aluno"}
        </Button>
      </form>
    </Form>
  );
}
