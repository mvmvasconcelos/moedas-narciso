import type { LucideIcon } from 'lucide-react';
import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  isLoading?: boolean;
  description?: string;
  unit?: string;
  type?: "coins" | "lids" | "cans" | "oil";
  variant?: 'blue' | 'amber' | 'green' | 'yellow' | 'default';
}

const variantStyles = {
  blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  amber: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
  green: 'bg-green-50 border-green-200 hover:bg-green-100',
  yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  default: 'hover:bg-accent'
};

const getVariantFromType = (type?: "coins" | "lids" | "cans" | "oil") => {
  switch (type) {
    case "coins":
      return "amber";
    case "lids":
      return "blue";
    case "cans":
      return "green";
    case "oil":
      return "yellow";
    default:
      return "default";
  }
};

// Função base antes da memoização
function StatCardBase({ 
  title, 
  value, 
  icon: Icon, 
  isLoading = false, 
  description,
  unit,  variant = 'default',
  type
}: StatCardProps) {
  const effectiveVariant = type ? getVariantFromType(type) : variant;
  return (
    <Card className={cn(
      "shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-center items-center text-center p-4",
      variantStyles[effectiveVariant]
    )}>
      <CardHeader className="p-0 flex flex-col items-center space-y-1 pb-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-2">
        {isLoading ? (
          <Skeleton className="h-7 w-3/4 mx-auto" />
        ) : (
          <>
            <div className="text-2xl font-bold text-primary">
              {value}
              {unit && <span className="text-sm ml-1">{unit}</span>}
            </div>
            {description && (
              <div className="text-xs text-muted-foreground mt-1">
                {description}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Exporta o componente memoizado para evitar re-renderizações desnecessárias
export const StatCard = memo(StatCardBase);
