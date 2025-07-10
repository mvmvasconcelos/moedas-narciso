
"use client";

import type { LucideIcon } from "lucide-react";
import type { Student } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { UserIcon } from "lucide-react";
import { StudentPhoto } from "@/components/alunos/StudentPhoto";

interface StudentRankCardProps {
  student: Student | undefined | null;
  title: string; // e.g. "#1 em Moedas", "Mais Tampas"
  value: string | number; // e.g. 150 or "150 Moedas"
  icon: LucideIcon;
  variant?: "prominent" | "default" | "small";
  isLoading?: boolean;
}

export function StudentRankCard({
  student,
  title,
  value,
  icon: ValueIcon,
  variant = "default",
  isLoading = false,
}: StudentRankCardProps) {
  // Determinar o tamanho da foto baseado na variante
  const getPhotoSize = () => {
    if (variant === "prominent") return "lg";  // h-16 w-16
    if (variant === "small") return "sm";      // h-8 w-8  
    return "md";                               // h-12 w-12 (default)
  };

  const cardClasses = cn(
    "shadow-lg transition-all duration-300 w-full",
    variant === "prominent" && "ring-2 ring-accent shadow-lg shadow-accent/40 p-6", // Enhanced prominent variant
    variant === "default" && "p-4",
    variant === "small" && "p-3"
  );

  const titleClasses = cn(
    "font-semibold tracking-tight",
    variant === "prominent" && "text-2xl font-bold text-accent", // Enhanced prominent variant
    variant === "default" && "text-lg",
    variant === "small" && "text-base"
  );

  const studentNameClasses = cn(
    "font-medium",
    variant === "prominent" && "text-xl font-semibold", // Enhanced prominent variant
    variant === "default" && "text-base",
    variant === "small" && "text-sm"
  );
  
  const valueDisplayClasses = cn(
    "font-bold flex items-center",
    variant === "prominent" && "text-4xl font-extrabold text-accent mt-1", // Enhanced prominent variant
    variant === "default" && "text-2xl text-primary",
    variant === "small" && "text-xl"
  );

  const valueIconSizeClasses = cn(
    "mr-2",
    variant === "prominent" ? "h-7 w-7 text-accent" : // Larger icon for prominent
    variant === "small" ? "h-4 w-4" : 
    "h-5 w-5"
  );


  if (isLoading) {
    return (
      <Card className={cardClasses}>
        <CardHeader className={cn("p-0 pb-2", variant === "small" && "pb-1", variant === "prominent" && "pb-3")}>
          <Skeleton className={cn("h-6 w-3/4", variant === "small" && "h-5 w-2/3", variant === "prominent" && "h-8 w-5/6")} />
        </CardHeader>
        <CardContent className="p-0 space-y-2">
          <div className="flex items-center space-x-3">
            <Skeleton className="rounded-full h-16 w-16" />
            <div className="space-y-1">
              <Skeleton className={cn("h-5 w-24", variant === "small" && "h-4 w-20", variant === "prominent" && "h-6 w-28")} />
              <Skeleton className={cn("h-4 w-16", variant === "small" && "h-3 w-12", variant === "prominent" && "h-4 w-20")} />
            </div>
          </div>
          <Skeleton className={cn("h-8 w-1/2", variant === "small" && "h-6 w-1/3", variant === "prominent" && "h-10 w-2/3")} />
        </CardContent>
      </Card>
    );
  }

  if (!student) {
    return (
      <Card className={cardClasses}>
        <CardHeader className={cn("p-0 pb-2", variant === "small" && "pb-1", variant === "prominent" && "pb-3")}>
          <CardTitle className={titleClasses}>{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex flex-col items-center justify-center min-h-[100px]">
          <UserIcon className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum aluno encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClasses}>
      <CardHeader className={cn("p-0", variant === "small" ? "pb-2" : variant === "prominent" ? "pb-4" : "pb-3")}>
        <CardTitle className={titleClasses}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-3">
        <div className="flex items-center space-x-3">
          <StudentPhoto 
            photoUrl={student.photo_url}
            name={student.name}
            size={getPhotoSize()}
            showLoading={false}
          />
          <div>
            <p className={studentNameClasses}>{student.name}</p>
            <CardDescription className={cn(variant === "small" ? "text-xs" : variant === "prominent" ? "text-base" : "text-sm")}>
              {student.className}
            </CardDescription>
          </div>
        </div>
        <div className={valueDisplayClasses}>
          <ValueIcon className={valueIconSizeClasses} />
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
