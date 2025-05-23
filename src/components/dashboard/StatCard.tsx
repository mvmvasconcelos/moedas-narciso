import type { LucideIcon } from 'lucide-react';
import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  isLoading?: boolean;
  description?: string;
}

// Função base antes da memoização
function StatCardBase({ title, value, icon: Icon, isLoading = false, description }: StatCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-center items-center text-center p-4">
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
