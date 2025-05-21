
"use client";

import type { LucideIcon } from "lucide-react";
import type { Student } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { UserIcon } from "lucide-react";

interface StudentRankCardProps {
  student: Student | undefined | null;
  title: string; // e.g. "#1 em Moedas", "Mais Tampas"
  value: string | number; // e.g. 150 or "150 Moedas"
  icon: LucideIcon;
  variant?: "prominent" | "default" | "small";
  isLoading?: boolean;
  avatarSeed?: string; // For consistent placeholder fallback initials
}

export function StudentRankCard({
  student,
  title,
  value,
  icon: ValueIcon,
  variant = "default",
  isLoading = false,
  avatarSeed,
}: StudentRankCardProps) {
  const getInitials = (name: string | undefined) => {
    if (!name) return "??";
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const cardClasses = cn(
    "shadow-lg transition-all duration-300 w-full",
    variant === "prominent" && "ring-2 ring-primary shadow-primary/30",
    variant === "small" && "p-3",
    variant === "default" && "p-4"
  );

  const titleClasses = cn(
    "font-semibold tracking-tight",
    variant === "prominent" && "text-xl text-primary",
    variant === "default" && "text-lg",
    variant === "small" && "text-base"
  );

  const studentNameClasses = cn(
    "font-medium",
    variant === "prominent" && "text-lg",
    variant === "default" && "text-base",
    variant === "small" && "text-sm"
  );
  
  const valueDisplayClasses = cn(
    "font-bold flex items-center",
    variant === "prominent" && "text-3xl text-primary",
    variant === "default" && "text-2xl text-primary",
    variant === "small" && "text-xl"
  );

  if (isLoading) {
    return (
      <Card className={cardClasses}>
        <CardHeader className={cn("p-0 pb-2", variant === "small" && "pb-1")}>
          <Skeleton className={cn("h-6 w-3/4", variant === "small" && "h-5 w-2/3")} />
        </CardHeader>
        <CardContent className="p-0 space-y-2">
          <div className="flex items-center space-x-3">
            <Skeleton className={cn("h-10 w-10 rounded-full", variant === "small" && "h-8 w-8")} />
            <div className="space-y-1">
              <Skeleton className={cn("h-5 w-24", variant === "small" && "h-4 w-20")} />
              <Skeleton className={cn("h-4 w-16", variant === "small" && "h-3 w-12")} />
            </div>
          </div>
          <Skeleton className={cn("h-8 w-1/2", variant === "small" && "h-6 w-1/3")} />
        </CardContent>
      </Card>
    );
  }

  if (!student) {
    return (
      <Card className={cardClasses}>
        <CardHeader className={cn("p-0 pb-2", variant === "small" && "pb-1")}>
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
      <CardHeader className={cn("p-0 pb-3", variant === "small" ? "pb-2" : "pb-3")}>
        <CardTitle className={titleClasses}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-3">
        <div className="flex items-center space-x-3">
          <Avatar className={cn(variant === "small" ? "h-8 w-8" : "h-10 w-10")}>
            {/* For testing, using placeholder.co. Replace with actual student image if available. */}
            <AvatarImage src={`https://placehold.co/40x40.png?text=${getInitials(avatarSeed || student.name)}`} alt={student.name} />
            <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className={studentNameClasses}>{student.name}</p>
            <CardDescription className={cn(variant === "small" ? "text-xs" : "text-sm")}>
              {student.className}
            </CardDescription>
          </div>
        </div>
        <div className={valueDisplayClasses}>
          <ValueIcon className={cn("mr-2", variant === "small" ? "h-4 w-4" : "h-5 w-5")} />
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
