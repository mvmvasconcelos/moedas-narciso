"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface StudentPhotoProps {
  /** URL da foto do aluno */
  photoUrl?: string | null;
  /** Nome do aluno para fallback com iniciais */
  name: string;
  /** Tamanho do avatar */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Classe CSS adicional */
  className?: string;
  /** Se deve mostrar indicador de loading */
  showLoading?: boolean;
}

// Mapeamento de tamanhos
const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
  xl: 'h-20 w-20 text-lg',
};

/**
 * Componente para exibir foto de perfil do aluno com fallback para iniciais
 */
export function StudentPhoto({ 
  photoUrl, 
  name, 
  size = 'md', 
  className, 
  showLoading = false 
}: StudentPhotoProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Gerar iniciais do nome
  const getInitials = (fullName: string): string => {
    if (!fullName || fullName.trim() === '') return '?';
    
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    
    // Pegar primeira letra do primeiro e último nome
    const firstInitial = names[0].charAt(0);
    const lastInitial = names[names.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
  };

  // Gerar cor de fundo baseada no nome para consistência
  const getBackgroundColor = (fullName: string): string => {
    if (!fullName) return 'bg-muted';
    
    const colors = [
      'bg-red-100 text-red-700',
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-yellow-100 text-yellow-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
      'bg-orange-100 text-orange-700',
    ];
    
    // Usar hash simples do nome para escolher cor consistente
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const initials = getInitials(name);
  const backgroundColorClass = getBackgroundColor(name);
  const shouldShowImage = photoUrl && !imageError;

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {shouldShowImage && (
        <AvatarImage
          src={photoUrl}
          alt={`Foto de ${name}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={cn(
            "object-cover",
            (isLoading && showLoading) && "opacity-0"
          )}
        />
      )}
      
      <AvatarFallback 
        className={cn(
          "font-medium select-none",
          backgroundColorClass,
          // Mostrar fallback se não há imagem, há erro, ou está carregando
          (!shouldShowImage || (isLoading && showLoading)) ? "opacity-100" : "opacity-0"
        )}
      >
        {(isLoading && showLoading) ? (
          <div className="animate-pulse">
            <div className="w-full h-full bg-current opacity-20 rounded-full" />
          </div>
        ) : (
          initials
        )}
      </AvatarFallback>
    </Avatar>
  );
}

// Variantes pré-definidas para casos comuns
export function StudentPhotoSmall(props: Omit<StudentPhotoProps, 'size'>) {
  return <StudentPhoto {...props} size="sm" />;
}

export function StudentPhotoLarge(props: Omit<StudentPhotoProps, 'size'>) {
  return <StudentPhoto {...props} size="lg" />;
}

export function StudentPhotoXLarge(props: Omit<StudentPhotoProps, 'size'>) {
  return <StudentPhoto {...props} size="xl" />;
}
