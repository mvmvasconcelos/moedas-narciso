"use client";

import { Button } from "@/components/ui/button";
import { PackageIcon, ArchiveIcon, DropletIcon, ArrowLeft } from "lucide-react";
import { MATERIAL_TYPES, type MaterialType, type Student } from "@/lib/constants";

interface MaterialSelectorProps {
  student: Student;
  onMaterialSelect: (materialType: MaterialType) => void;
  onBack: () => void;
}

export function MaterialSelector({ student, onMaterialSelect, onBack }: MaterialSelectorProps) {
  const handleMaterialClick = (materialType: MaterialType) => {
    onMaterialSelect(materialType);
  };

  return (
    <div className="space-y-6">
      {/* Header com informações do aluno */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="absolute left-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <h2 className="text-xl font-bold">Selecione o tipo de material</h2>
        </div>
        <p className="text-muted-foreground mb-2">
          Escolha o material que <strong>{student.name}</strong> trouxe para registrar a troca.
        </p>
        <p className="text-sm text-muted-foreground">
          Turma: {student.className}
        </p>
      </div>
      
      {/* Botões de seleção de material */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col space-y-2 hover:bg-primary hover:text-primary-foreground"
          onClick={() => handleMaterialClick(MATERIAL_TYPES.LIDS)}
        >
          <PackageIcon className="h-8 w-8 mb-2" />
          <span className="text-lg font-medium">Tampinhas</span>
          <span className="text-xs text-muted-foreground">Registrar troca de tampinhas plásticas</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col space-y-2 hover:bg-primary hover:text-primary-foreground"
          onClick={() => handleMaterialClick(MATERIAL_TYPES.CANS)}
        >
          <ArchiveIcon className="h-8 w-8 mb-2" />
          <span className="text-lg font-medium">Latinhas</span>
          <span className="text-xs text-muted-foreground">Registrar troca de latinhas</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col space-y-2 hover:bg-primary hover:text-primary-foreground"
          onClick={() => handleMaterialClick(MATERIAL_TYPES.OIL)}
        >
          <DropletIcon className="h-8 w-8 mb-2" />
          <span className="text-lg font-medium">Óleo</span>
          <span className="text-xs text-muted-foreground">Registrar troca de óleo usado</span>
        </Button>
      </div>
    </div>
  );
}