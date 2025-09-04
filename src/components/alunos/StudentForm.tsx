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
import type { Student, GenderType } from "@/lib/constants";
import { GENDER_LABELS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { DataService } from "@/lib/dataService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, X, Upload } from "lucide-react";

const studentFormSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
  className: z.string({ required_error: "Por favor, selecione uma turma." }),
  gender: z.enum(['masculino', 'feminino', 'outro', 'prefiroNaoInformar'], {
    required_error: "Por favor, selecione o gênero.",
  }),
  // Campo de foto é opcional - será tratado separadamente
  photo: z.any().optional(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  student?: Student | null; // Para edição
  onSuccess: () => void;
}

export function StudentForm({ student, onSuccess }: StudentFormProps) {
  const { classes, addStudent, updateStudent } = useAuth();
  const { toast } = useToast();

  // Estados para gerenciamento de foto
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  // Carregar foto atual do aluno (se estiver editando)
  useEffect(() => {
    if (student?.id) {
      DataService.getStudentPhotoUrl(student.id)
        .then(url => {
          setCurrentPhotoUrl(url);
        })
        .catch(error => {
          console.error('Erro ao carregar foto do aluno:', error);
        });
    }
  }, [student?.id]);

  // Função para validar arquivo de imagem
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de arquivo não permitido. Use apenas JPG, PNG ou WebP.';
    }

    if (file.size > maxSize) {
      return 'Arquivo muito grande. Tamanho máximo: 5MB.';
    }

    return null;
  };

  // Função para lidar com seleção de arquivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError(null);
    setSelectedFile(file);

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Função para remover foto selecionada
  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    
    // Limpar input de arquivo
    const fileInput = document.getElementById('photo-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Função para remover foto atual do aluno
  const handleRemoveCurrentPhoto = async () => {
    if (!student?.id) return;

    try {
      setIsUploading(true);
      await DataService.deleteStudentPhoto(student.id);
      setCurrentPhotoUrl(null);
      toast({
        title: "Sucesso!",
        description: "Foto removida com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao remover foto",
        description: "Não foi possível remover a foto. Tente novamente.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  async function onSubmit(data: StudentFormValues) {
    try {
      setIsUploading(true);
      setUploadError(null);

      let photoUrl = currentPhotoUrl;

      // Se há uma nova foto selecionada, fazer upload
      if (selectedFile && data.className) {
        try {
          if (student?.id) {
            // Atualizar foto existente
            photoUrl = await DataService.updateStudentPhoto(
              selectedFile,
              student.id,
              data.name,
              data.className
            );
          } else {
            // Para novo aluno, vamos fazer upload após criar o aluno
            // Por agora, vamos armazenar o arquivo para processar depois
          }
        } catch (uploadError) {
          console.error('Erro no upload da foto:', uploadError);
          toast({
            variant: "destructive",
            title: "Erro no upload da foto",
            description: "A foto não pôde ser enviada, mas o aluno será salvo sem foto.",
          });
        }
      }

      // Salvar dados do aluno
      if (student) {
        await updateStudent({ ...student, ...data });
        toast({
          title: "Sucesso!",
          description: `Aluno ${data.name} atualizado com sucesso.`,
        });
      } else {
        const newStudent = await addStudent(data);
        
        // Se há foto selecionada para novo aluno, fazer upload agora
        if (selectedFile && newStudent?.id && data.className) {
          try {
            await DataService.updateStudentPhoto(
              selectedFile,
              newStudent.id,
              data.name,
              data.className
            );
          } catch (uploadError) {
            console.error('Erro no upload da foto do novo aluno:', uploadError);
            toast({
              variant: "destructive",
              title: "Aluno salvo, mas erro no upload da foto",
              description: "O aluno foi criado, mas a foto não pôde ser enviada.",
            });
          }
        }
        
        toast({
          title: "Sucesso!",
          description: `Aluno ${data.name} adicionado com sucesso.`,
        });
      }
      
      onSuccess();
      form.reset({ name: "", className: "", gender: defaultGender });
      handleRemovePhoto();
      setCurrentPhotoUrl(null);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: `Não foi possível ${student ? 'atualizar' : 'adicionar'} o aluno. Tente novamente.`,
      });
    } finally {
      setIsUploading(false);
    }
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

        {/* Campo de Upload de Foto */}
        <div className="space-y-4">
          <FormLabel>Foto de Perfil (Opcional)</FormLabel>
          
          {/* Preview da foto atual ou nova */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              {(previewUrl || currentPhotoUrl) ? (
                <AvatarImage 
                  src={previewUrl || currentPhotoUrl || ''} 
                  alt={form.watch('name') || 'Foto do aluno'} 
                />
              ) : (
                <AvatarFallback className="text-lg">
                  {form.watch('name') 
                    ? form.watch('name').substring(0, 2).toUpperCase() 
                    : <Camera className="h-8 w-8 text-muted-foreground" />
                  }
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 space-y-2">
              {/* Botões de ação */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('photo-input')?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {currentPhotoUrl ? 'Alterar Foto' : 'Adicionar Foto'}
                </Button>
                
                {(previewUrl || currentPhotoUrl) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={previewUrl ? handleRemovePhoto : handleRemoveCurrentPhoto}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                )}
              </div>
              
              {/* Informações sobre upload */}
              <div className="text-sm text-muted-foreground">
                <p>Tipos aceitos: JPG, PNG, WebP</p>
                <p>Tamanho máximo: 5MB</p>
              </div>
              
              {/* Erro de upload */}
              {uploadError && (
                <div className="text-sm text-destructive">
                  {uploadError}
                </div>
              )}
              
              {/* Indicador de loading */}
              {isUploading && (
                <div className="text-sm text-primary">
                  Enviando foto...
                </div>
              )}
            </div>
          </div>
          
          {/* Input de arquivo oculto */}
          <input
            id="photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
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
        <Button type="submit" className="w-full" disabled={isUploading}>
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
              {student ? "Salvando..." : "Adicionando..."}
            </>
          ) : (
            student ? "Salvar Alterações" : "Adicionar Aluno"
          )}
        </Button>
      </form>
    </Form>
  );
}
