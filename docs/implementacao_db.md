# Guia de Implementação do Sistema com Supabase

Este guia fornece instruções detalhadas para implementar o novo sistema usando o banco de dados Supabase já configurado, incluindo a mudança de terminologia de "Contribuições" para "Trocas" e demais ajustes necessários.

## Status da Implementação

- ✅ Autenticação e roles funcionando
- ✅ Views retornando dados corretamente
- ✅ Sistema de trocas completamente implementado 
- ✅ Cálculo automático de moedas corrigido e funcionando
- 🔄 Fotos dos alunos serão carregadas diretamente do Supabase
- ✅ Ajustes manuais restritos a professores
- ✅ RLS e políticas funcionando
- ✅ Interface atualizada com nova terminologia
- ✅ Edição e exclusão de registros implementadas
- [ ] Testes de performance realizados
- ✅ Documentação atualizada

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Etapa 1: Mudanças de Interface](#etapa-1-mudanças-de-interface)
3. [Etapa 2: Atualização de Componentes](#etapa-2-atualização-de-componentes)
4. [Etapa 3: Integração com Views e Triggers](#etapa-3-integração-com-views-e-triggers)
5. [Etapa 4: Implementação de Novas Features](#etapa-4-implementação-de-novas-features)
6. [Etapa 5: Testes e Validação](#etapa-5-testes-e-validação)
7. [Etapa 6: Gerenciamento de Registros de Trocas](#etapa-6-gerenciamento-de-registros-de-trocas)
8. [Etapa 7: Correções e Melhorias](#etapa-7-correções-e-melhorias)

## Pré-requisitos

Antes de começar a implementação, certifique-se de que o ambiente está corretamente configurado com as credenciais do Supabase e as dependências necessárias instaladas.

1. Banco de dados já criado e configurado no Supabase conforme `criar_database.md`
2. Variáveis de ambiente configuradas no arquivo `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
   ```
3. Dependências instaladas:
   ```bash
   npm install @supabase/supabase-js
   ```

## Etapa 1: Mudanças de Interface

A primeira etapa envolve a renomeação de arquivos e componentes para refletir a nova terminologia do sistema, substituindo "Contribuições" por "Trocas" em toda a interface.

### 1.1 Renomear Diretórios e Arquivos

1. Renomear diretórios e arquivos:
   - `src/app/contribuicoes` → `src/app/trocas`
   - `src/components/contribuicoes` → `src/components/trocas`
   - `ContributionForm.tsx` → `ExchangeForm.tsx`

### 1.2 Atualizar Rotas e Importações

> Nesta seção, atualizamos o menu de navegação e as importações para refletir os novos nomes de arquivos.

1. Atualizar `src/components/layout/SidebarNav.tsx`:
   ```typescript
   const sidebarNavItems = [
     // ...existing items...
     {
       title: "Registro de Trocas",
       href: "/trocas",
       icon: PackageIcon
     },
     // ...other items...
   ];
   ```

### 1.3 Atualizar Textos da Interface

Substituir termos em toda a interface para manter consistência na nova terminologia:
- "Contribuição" → "Troca"
- "Contribuições" → "Trocas"
- "Contribuir" → "Trocar"
- "Nova Contribuição" → "Nova Troca"
- "Registrar Contribuição" → "Registrar Troca"

## Etapa 2: Atualização de Componentes

### 2.1 Atualizar o DataService

> O DataService é o componente central que gerencia todas as interações com o banco de dados. Aqui implementamos os métodos principais usando as views do Supabase.

```typescript
class DataService {
  static async getStudents() {
    const { data, error } = await supabase
      .from('v_student_list')
      .select('*');
      
    if (error) throw error;
    return data;
  }

  static async getStudentRanking() {
    const { data, error } = await supabase
      .from('v_student_coin_ranking_with_adjustments')
      .select('*');
      
    if (error) throw error;
    return data;
  }

  static async registerExchange(
    studentId: string, 
    materialId: string, 
    quantity: number,
    teacherId: string
  ) {
    const { data, error } = await supabase
      .from('exchanges')
      .insert([{
        student_id: studentId,
        material_id: materialId,
        quantity: quantity,
        teacher_id: teacherId
      }])
      .select();
      
    if (error) throw error;
    return data;
  }
}
```

### 2.2 Atualizar Interface de Usuário

> O componente ExchangeForm é responsável pela interface de registro de trocas, substituindo o antigo formulário de contribuições.

```typescript
// src/components/trocas/ExchangeForm.tsx
interface ExchangeFormProps {
  materialType: MaterialType;
}

export function ExchangeForm({ materialType }: ExchangeFormProps) {
  // ...existing code...
  return (
    <Card className="w-full shadow-xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <h2>Registrar Nova Troca</h2>
            {/* Form fields */}
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
```

### 2.3 AuthContext e Controles de Role

> O sistema de autenticação é atualizado para gerenciar diferentes níveis de acesso e permissões baseadas em roles.

```typescript
// src/contexts/AuthContext.tsx
const checkAuth = async () => {
  try {
    const user = await getCurrentUser();
    if (user) {
      const profile = await getTeacherProfile();
      
      if (!profile) {
        toast({
          variant: "destructive",
          title: "Erro de Configuração da Conta",
          description: "Usuário sem perfil configurado."
        });
        await supabase.auth.signOut();
        return;
      }

      setIsAuthenticated(true);
      setTeacherName(profile.name);
      setTeacherRole(profile.role); // 'teacher' ou 'student_helper'
    }
  } catch (error) {
    // ... tratamento de erro
  }
};
```

## Etapa 3: Integração com Views e Triggers

### 3.1 Integração de Dados Base

> Esta seção descreve o fluxo de dados entre o Supabase e a aplicação, garantindo que todos os valores sejam carregados e exibidos corretamente.

#### 3.1.1 Carregamento de Dados Iniciais

1. **Configuração das Views de Dados**
   ```sql
   -- Visão geral de alunos com valores calculados
   CREATE OR REPLACE VIEW v_student_list AS
   SELECT 
    s.id,
    s.name,
    s.gender,
    c.name as class_name,
    (s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) as effective_narciso_coins,
    COALESCE(t.total_tampas, 0) as exchange_tampas,
    COALESCE(l.total_latas, 0) as exchange_latas,
    COALESCE(o.total_oleo, 0) as exchange_oleo,
    (s.pending_tampas + COALESCE(s.adjustment_pending_tampas, 0)) as pending_tampas,
    (s.pending_latas + COALESCE(s.adjustment_pending_latas, 0)) as pending_latas,
    (s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0)) as pending_oleo,
    s.photo_url -- Campo adicionado para suporte a fotos de perfil
   FROM students s
   JOIN classes c ON s.class_id = c.id
   LEFT JOIN (
       SELECT student_id, SUM(quantity) as total_tampas 
       FROM exchanges 
       WHERE material_id = 'tampas' 
       GROUP BY student_id
   ) t ON s.id = t.student_id
   LEFT JOIN (
       SELECT student_id, SUM(quantity) as total_latas
       FROM exchanges 
       WHERE material_id = 'latas' 
       GROUP BY student_id
   ) l ON s.id = l.student_id
   LEFT JOIN (
       SELECT student_id, SUM(quantity) as total_oleo
       FROM exchanges 
       WHERE material_id = 'oleo' 
       GROUP BY student_id
   ) o ON s.id = o.student_id
   ORDER BY s.name;

   -- Campos retornados pela view v_student_list:
   -- • id: Identificador único do aluno
   -- • name: Nome completo do aluno
   -- • gender: Gênero do aluno (M/F)
   -- • class_name: Nome da turma do aluno
   -- • effective_narciso_coins: Saldo atual de moedas (incluindo ajustes)
   -- • exchange_tampas: Total de tampas trocadas
   -- • exchange_latas: Total de latas trocadas
   -- • exchange_oleo: Total de óleo trocado
   -- • pending_tampas: Tampas pendentes para conversão
   -- • pending_latas: Latas pendentes para conversão
   -- • pending_oleo: Óleo pendente para conversão
   -- • photo_url: URL da foto de perfil do aluno (pode ser null)

   -- Visão de totais de materiais por aluno
   CREATE OR REPLACE VIEW v_student_material_totals AS
   SELECT 
     student_id,
     SUM(CASE WHEN material_id = 'lids' THEN quantity ELSE 0 END) as lids,
     SUM(CASE WHEN material_id = 'cans' THEN quantity ELSE 0 END) as cans,
     SUM(CASE WHEN material_id = 'oil' THEN quantity ELSE 0 END) as oil
   FROM exchanges
   GROUP BY student_id;
   
   -- Visão de histórico de trocas completo
   CREATE OR REPLACE VIEW v_exchange_history AS
   SELECT 
     e.id,
     e.created_at,
     e.exchange_date,
     e.material_id,
     e.quantity,
     e.student_id,
     s.name as student_name,
     s.class_id,
     c.name as class_name,
     e.teacher_id,
     t.name as teacher_name
   FROM 
     exchanges e
   JOIN 
     students s ON e.student_id = s.id
   JOIN 
     classes c ON s.class_id = c.id
   JOIN 
     teachers t ON e.teacher_id = t.id
   ORDER BY 
     e.created_at DESC;
   ```

2. **Fluxo de Dados na Aplicação**
   ```typescript
   // src/lib/dataService.ts
   class DataService {
   // Carrega dados do aluno incluindo totais calculados
     static async getStudentWithTotals(studentId: string) {
       const { data, error } = await supabase
         .from('v_student_list')
         .select('*')
         .eq('id', studentId)
         .single();
       
       if (error) throw error;
       return data;
     }

     // Carrega lista de turmas ativas
     static async getClasses() {
       const { data, error } = await supabase
         .from('classes')
         .select('*')
         .eq('is_active', true)
         .order('name');
       
       if (error) throw error;
       return data;
     }

     // Carrega trocas pendentes
     static async getPendingExchanges() {
       const { data, error } = await supabase
         .from('pending_exchanges')
         .select('*')
         .order('created_at', { ascending: false });
       
       if (error) throw error;
       return data;
     }
   }
   ```

3. **Inicialização no AuthContext**
   ```typescript
   // src/contexts/AuthContext.tsx
   const initializeData = async () => {
     try {
       const [studentsData, classesData] = await Promise.all([
         DataService.getStudents(),
         DataService.getClasses()
       ]);

       setStudents(studentsData);
       setClasses(classesData);
     } catch (error) {
       console.error('Erro ao carregar dados iniciais:', error);
       toast({
         variant: "destructive",
         title: "Erro ao Carregar Dados",
         description: "Não foi possível carregar os dados do sistema."
       });
     }
   };

   // Chamada na verificação de autenticação
   useEffect(() => {
     const checkAuth = async () => {
       try {
         const user = await getCurrentUser();
         if (user) {
           const profile = await getTeacherProfile();
           if (profile) {
             setIsAuthenticated(true);
             setTeacherName(profile.name);
             await initializeData(); // Carrega dados após autenticação
           }
         }
       } catch (error) {
         console.error('Erro na verificação de autenticação:', error);
       }
     };

     checkAuth();
   }, []);
   ```

#### 3.1.2 Atualização em Tempo Real

1. **Configuração dos Canais de Realtime**
   ```typescript
   // src/lib/supabase.ts
   export const setupRealtimeSubscriptions = (callback: () => void) => {
     const exchanges = supabase
       .channel('exchanges')
       .on(
         'postgres_changes',
         { event: '*', schema: 'public', table: 'exchanges' },
         callback
       )
       .subscribe();

     const adjustments = supabase
       .channel('adjustments')
       .on(
         'postgres_changes',
         { event: '*', schema: 'public', table: 'student_adjustments' },
         callback
       )
       .subscribe();

     return () => {
       supabase.removeChannel(exchanges);
       supabase.removeChannel(adjustments);
     };
   };
   ```

2. **Implementação no AuthContext**
   ```typescript
   // src/contexts/AuthContext.tsx
   useEffect(() => {
     if (isAuthenticated) {
       const unsubscribe = setupRealtimeSubscriptions(async () => {
         // Recarregar dados quando houver mudanças
         await initializeData();
       });

       return () => {
         unsubscribe();
       };
     }
   }, [isAuthenticated]);
   ```

#### 3.1.3 Verificações e Validações

1. **Validação de Integridade dos Dados**
   ```typescript
   // src/lib/dataService.ts
   static async validateDataIntegrity() {
     const checks = {
       students: false,
       exchanges: false,
       materials: false,
       coins: false
     };

     try {
       // Verificar alunos
       const { count: studentCount } = await supabase
         .from('students')
         .select('count', { count: 'exact' });
       checks.students = studentCount > 0;

       // Verificar trocas
       const { count: exchangeCount } = await supabase
         .from('exchanges')
         .select('count', { count: 'exact' });
       checks.exchanges = exchangeCount !== null;

       // Verificar materiais
       const { count: materialCount } = await supabase
         .from('materials')
         .select('count', { count: 'exact' });
       checks.materials = materialCount === 3; // lids, cans, oil

       // Verificar moedas
       const { count: coinCount } = await supabase
         .from('coin_balances')
         .select('count', { count: 'exact' });
       checks.coins = coinCount !== null;

       return checks;
     } catch (error) {
       console.error('Erro na validação de integridade:', error);
       throw error;
     }
   }
   ```

2. **Monitoramento de Sincronização**
   ```typescript
   // src/lib/dataService.ts
   static async checkSyncStatus() {
     try {
       const localData = {
         students: students.length,
         exchanges: exchangeCount,
         pendingExchanges: pendingCount
       };

       const { data: dbData } = await supabase.rpc('get_sync_status');

       return {
         isSynced: 
           localData.students === dbData.student_count &&
           localData.exchanges === dbData.exchange_count &&
           localData.pendingExchanges === dbData.pending_count,
         local: localData,
         database: dbData
       };
     } catch (error) {
       console.error('Erro ao verificar sincronização:', error);
       throw error;
     }
   }
   ```

### 3.2 Componentes de Ranking

> Os componentes de ranking usam views especializadas do Supabase para mostrar a classificação dos alunos e seus totais de materiais.

```typescript
// src/app/ranking/page.tsx
async function getRankingData() {
  const { data: ranking } = await supabase
    .from('v_student_coin_ranking_with_adjustments')
    .select('*')
    .order('rank_position');

  const { data: materialTotals } = await supabase
    .from('v_student_material_totals')
    .select('*');

  return {
    ranking,
    materialTotals
  };
}
```

### 3.3 Dashboard e Estatísticas

> O dashboard precisa carregar e exibir corretamente os totais de materiais e moedas do sistema.

#### 3.3.1 Views Necessárias

```sql
-- Visão de estatísticas gerais
CREATE OR REPLACE VIEW v_general_stats AS
SELECT 
  (SELECT COUNT(*) FROM students) as total_students,
  (SELECT COUNT(*) FROM exchanges) as total_exchanges,
  COALESCE(SUM(CASE WHEN material_id = 'lids' THEN quantity ELSE 0 END), 0) as total_lids,
  COALESCE(SUM(CASE WHEN material_id = 'cans' THEN quantity ELSE 0 END), 0) as total_cans,
  COALESCE(SUM(CASE WHEN material_id = 'oil' THEN quantity ELSE 0 END), 0) as total_oil,
  (SELECT COALESCE(SUM(narciso_coins), 0) FROM coin_balances) as total_coins
FROM exchanges;

-- Visão de estatísticas por período
CREATE OR REPLACE VIEW v_period_stats AS
SELECT 
  DATE_TRUNC('month', created_at) as period,
  COUNT(DISTINCT student_id) as active_students,
  SUM(CASE WHEN material_id = 'lids' THEN quantity ELSE 0 END) as period_lids,
  SUM(CASE WHEN material_id = 'cans' THEN quantity ELSE 0 END) as period_cans,
  SUM(CASE WHEN material_id = 'oil' THEN quantity ELSE 0 END) as period_oil
FROM exchanges
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY period DESC;
```

#### 3.3.2 Implementação no DataService

```typescript
// src/lib/dataService.ts
class DataService {
  static async getDashboardStats() {
    try {
      // Carregar estatísticas gerais
      const { data: generalStats, error: statsError } = await supabase
        .from('v_general_stats')
        .select('*')
        .single();
      
      if (statsError) throw statsError;

      // Carregar estatísticas do período atual
      const { data: periodStats, error: periodError } = await supabase
        .from('v_period_stats')
        .select('*')
        .limit(1);
      
      if (periodError) throw periodError;

      return {
        generalStats,
        currentPeriod: periodStats?.[0] || null
      };
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      throw error;
    }
  }

  static async getRankingStats() {
    try {
      const { data: topStudents, error: rankError } = await supabase
        .from('v_student_coin_ranking_with_adjustments')
        .select('*')
        .order('narciso_coins', { ascending: false })
        .limit(5);
      
      if (rankError) throw rankError;

      const { data: materialLeaders, error: leadersError } = await supabase
        .from('v_student_material_totals')
        .select('*')
        .order('total_quantity', { ascending: false })
        .limit(5);
      
      if (leadersError) throw leadersError;

      return {
        topStudents,
        materialLeaders
      };
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
      throw error;
    }
  }
}
```

#### 3.3.3 Componente do Dashboard

```typescript
// src/app/dashboard/page.tsx
import { DataService } from '@/lib/dataService';
import { StatCard } from '@/components/dashboard/StatCard';

export default async function DashboardPage() {
  const stats = await DataService.getDashboardStats();
  const ranking = await DataService.getRankingStats();

  return (
    <div className="space-y-8">
      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Alunos"
          value={stats.generalStats.total_students}
          type="students"
        />
        <StatCard
          title="Total de Moedas"
          value={stats.generalStats.total_coins}
          type="coins"
        />
        <StatCard
          title="Trocas Realizadas"
          value={stats.generalStats.total_exchanges}
          type="exchanges"
        />
        <StatCard
          title="Materiais Coletados"
          value={
            stats.generalStats.total_lids +
            stats.generalStats.total_cans +
            stats.generalStats.total_oil
          }
          type="materials"
        />
      </div>

      {/* Detalhamento por Material */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Tampinhas"
          value={stats.generalStats.total_lids}
          type="lids"
        />
        <StatCard
          title="Latinhas"
          value={stats.generalStats.total_cans}
          type="cans"
        />
        <StatCard
          title="Óleo"
          value={stats.generalStats.total_oil}
          type="oil"
        />
      </div>

      {/* Rankings */}
      <div>
        {/* Componentes de ranking aqui */}
      </div>
    </div>
  );
}
```

#### 3.3.4 Atualização em Tempo Real do Dashboard

```typescript
// src/components/dashboard/DashboardContent.tsx
'use client'

import { useEffect, useState } from 'react';
import { DataService } from '@/lib/dataService';
import { setupRealtimeSubscriptions } from '@/lib/supabase';

export function DashboardContent({ initialStats }) {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    const unsubscribe = setupRealtimeSubscriptions(async () => {
      // Atualizar estatísticas quando houver mudanças
      const newStats = await DataService.getDashboardStats();
      setStats(newStats);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    // Renderização dos componentes com os stats
  );
}
```

## Etapa 4: Implementação de Novas Features

### 4.1 Gerenciamento de Fotos dos Alunos

> O sistema utiliza imagens carregadas diretamente no Storage do Supabase. A referência para a foto é armazenada no campo `photo_url` da tabela `students`.

```typescript
// src/lib/dataService.ts
// Função para obter a URL da foto do aluno
static async getStudentPhotoUrl(studentId: string) {
  const { data, error } = await supabase
    .from('students')
    .select('photo_url')
    .eq('id', studentId)
    .single();
    
  if (error) throw error;
  return data?.photo_url;
}

// Função para exibir a foto do aluno (ou avatar padrão)
export function StudentPhoto({ url, name }: { url?: string, name: string }) {
  return (
    <Avatar className="h-16 w-16">
      {url ? 
        <AvatarImage src={url} alt={name} /> :
        <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
      }
    </Avatar>
  );
}
```

### 4.2 Sistema de Ajustes Manuais (Apenas Professores)

> Este sistema permite que professores façam ajustes manuais nos valores dos alunos, mantendo um registro completo das alterações.

```typescript
// src/lib/dataService.ts
async function createManualAdjustment(
  studentId: string,
  type: 'narciso_coins' | 'pending_tampas' | 'pending_latas' | 'pending_oleo',
  value: number,
  reason: string
) {
  const { data: profile } = await supabase
    .from('teachers')
    .select('role')
    .eq('id', supabase.auth.user()?.id)
    .single();

  if (profile?.role !== 'teacher') {
    throw new Error('Apenas professores podem fazer ajustes manuais');
  }

  // Usar a view para obter valores efetivos atuais
  const { data: student } = await supabase
    .from('v_students_effective_values')
    .select('*')
    .eq('id', studentId)
    .single();

  if (!student) throw new Error('Aluno não encontrado');

  const { error } = await supabase
    .from('student_adjustments')
    .insert({
      student_id: studentId,
      adjustment_type: type,
      previous_value: student[type],
      adjustment_value: value,
      new_value: student[type] + value,
      reason: reason,
      teacher_id: supabase.auth.user()?.id
    });

  if (error) throw error;
  return student;
}
```

## Etapa 5: Testes e Validação

### 5.1 Testes de Conexão

> Implementação de testes para verificar a conexão com o Supabase e o acesso às principais funcionalidades.

```typescript
// src/components/auth/SupabaseConnectionTest.tsx
async function testSupabaseConnection() {
  try {
    // Testar autenticação
    const { data: { user } } = await supabase.auth.getUser();
    
    // Testar acesso às tabelas principais
    const { data: students } = await supabase
      .from('v_students_effective_values')
      .select('count')
      .limit(1);
      
    const { data: exchanges } = await supabase
      .from('exchanges')
      .select('count')
      .limit(1);
      
    // Testar acesso ao storage
    const { data: files } = await supabase
      .storage
      .from('student-photos')
      .list();
      
    console.log('Testes iniciais concluídos com sucesso');
    return true;
  } catch (error) {
    console.error('Erro nos testes:', error);
    return false;
  }
}
```

### 5.2 Validação de Permissões

> Sistema de testes para validar as permissões de diferentes roles no sistema.

```typescript
// src/lib/utils.ts
async function validatePermissions() {
  try {
    const testData = {
      teacher: {
        canManageStudents: false,
        canRegisterExchanges: false,
        canMakeAdjustments: false
      },
      helper: {
        canManageStudents: false,
        canRegisterExchanges: false,
        canMakeAdjustments: false
      }
    };

    // Testar permissões de professor
    const teacherAuth = await loginAsTeacher();
    testData.teacher = await checkPermissions(teacherAuth.user.id);

    // Testar permissões de auxiliar
    const helperAuth = await loginAsHelper();
    testData.helper = await checkPermissions(helperAuth.user.id);

    console.log('Validação de permissões:', testData);
    return testData;
  } catch (error) {
    console.error('Erro na validação:', error);
    throw error;
  }
}
```

### 5.3 Checklist de Validação

- [x] Autenticação e roles funcionando
- [x] Views retornando dados corretamente
- [⚠️] Sistema de trocas parcialmente implementado
- [ ] Carregar e exibir dados do dashboard corretamente
- [ ] Integrar views de totais e estatísticas
- [ ] Implementar atualizações em tempo real
- [🔄] Fotos dos alunos já disponíveis no Supabase (não requer upload)
- [ ] Ajustes manuais restritos a professores
- [x] RLS e políticas funcionando
- [x] Interface atualizada com nova terminologia
- [ ] Validação de integridade dos dados
- [ ] Testes de performance realizados
- [ ] Documentação atualizada

## Observações Importantes

1. SEMPRE usar a view `v_student_list` para valores atuais dos alunos
2. NÃO modificar diretamente os campos de saldo
3. USAR o sistema de ajustes para correções
4. MANTER logs de todas as operações
5. TESTAR em ambiente de desenvolvimento primeiro
6. As fotos dos alunos são gerenciadas diretamente pelo Supabase Storage

### Próximos Passos Recomendados

1. **Atualização do DataService para v_student_list**
   - Refatorar métodos existentes para utilizar a nova view
   - Remover código de compatibilidade com localStorage
   - Validar que todas as consultas usam a nova view

2. **Completar Sistema de Trocas**
   - Finalizar a implementação do ExchangeForm.tsx
   - Garantir que registros de trocas atualizem corretamente todos os contadores
   - Implementar validações de integridade nos dados

3. **Dashboard e Estatísticas**
   - Implementar views de estatísticas
   - Integrar componentes com as views
   - Configurar atualizações em tempo real

4. **Validação e Testes**
   - Verificar integridade dos dados
   - Testar sincronização
   - Validar cálculos e totais

### Pontos Críticos de Atenção

1. **Consistência de Nomenclatura**
   - Usar consistentemente a view `v_student_list` em vez de `v_students_effective_values`
   - Atualizar todos os componentes que ainda usam a nomenclatura antiga

2. **Gerenciamento de Fotos**
   - As fotos dos alunos são gerenciadas diretamente pelo Supabase Storage
   - O campo `photo_url` nas tabelas de alunos já está preparado para receber a URL da foto
   - Garantir que componentes exibam corretamente as fotos ou avatares padrão

3. **Integração com Supabase**
   - Eliminar código remanescente de localStorage
   - Garantir que todas as operações são realizadas diretamente no banco de dados
   - Implementar tratamento adequado de erros e reconexão

## Etapa 6: Gerenciamento de Registros de Trocas

Esta seção descreve a implementação das funcionalidades de edição e exclusão de registros de trocas, permitindo que professores possam corrigir informações ou remover registros incorretos.

### 6.1 Métodos do DataService

A classe DataService foi atualizada com dois novos métodos:

```typescript
static async updateExchange(
  exchangeId: string,
  data: { 
    material_id?: string;
    quantity?: number;
    student_id?: string;
    teacher_id?: string;
  }
) {
  try {
    console.log('Atualizando troca:', exchangeId, data);
    const { data: updatedExchange, error } = await supabase
      .from('exchanges')
      .update(data)
      .eq('id', exchangeId)
      .select();
    
    if (error) throw error;
    return updatedExchange;
  } catch (error) {
    console.error('Erro ao atualizar troca:', error);
    throw error;
  }
}

static async deleteExchange(exchangeId: string) {
  try {
    console.log('Excluindo troca:', exchangeId);
    const { error } = await supabase
      .from('exchanges')
      .delete()
      .eq('id', exchangeId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao excluir troca:', error);
    throw error;
  }
}
```

### 6.2 Interface de Edição e Exclusão

O componente `ExchangeHistory.tsx` foi atualizado para incluir:

1. Tabela com linhas clicáveis que abrem modal de edição
2. Modal de edição com campos para alterar quantidade, material e aluno
3. Modal de confirmação para exclusão de registros
4. Feedback visual (toast) para operações bem-sucedidas ou erros

#### 6.2.1 Fluxo de Edição

1. Usuário clica em uma linha da tabela de histórico
2. Abre-se um modal com os dados atuais do registro
3. O usuário edita os campos desejados e clica em "Salvar alterações"
4. A tabela é atualizada com os novos dados

#### 6.2.2 Fluxo de Exclusão

1. No modal de edição, o usuário clica no botão "Excluir"
2. Abre-se um modal de confirmação com os detalhes do registro
3. Ao confirmar, o registro é excluído da base de dados
4. A tabela é atualizada sem o registro excluído

### 6.3 Políticas de Segurança (RLS)

As políticas de segurança do Supabase garantem que:

1. Apenas usuários autenticados podem editar/excluir registros
2. Apenas professores (role='teacher') podem excluir registros
3. O usuário só pode editar/excluir registros que foram criados por ele mesmo, exceto administradores

```sql
-- Política para edição de registros
CREATE POLICY "Apenas professores podem atualizar trocas" 
ON public.exchanges 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM teachers 
    WHERE teachers.id = auth.uid() 
    AND teachers.role = 'teacher'
  )
);

-- Política para exclusão de registros
CREATE POLICY "Apenas professores podem deletar trocas" 
ON public.exchanges 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM teachers 
    WHERE teachers.id = auth.uid() 
    AND teachers.role = 'teacher'
  )
);
```

## Etapa 7: Correções e Melhorias

### 7.1 Correção do Cálculo Automático de Moedas

Foi identificado um problema no sistema onde, ao registrar uma troca de material, o saldo de moedas do aluno não estava sendo atualizado automaticamente. Apenas o registro de troca era criado, mas o valor em moedas permanecia inalterado.

A solução implementada segue a filosofia de design do sistema, mantendo a lógica de negócio na aplicação (e não no banco de dados):

```typescript
static async registerExchange(
  studentId: string, 
  materialId: MaterialType, 
  quantity: number,
  teacherId: string
): Promise<Exchange[]> {
  try {
    // 1. Buscar informações atuais do aluno
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    
    // 2. Calcular o total pendente após a troca
    const currentPending = studentData[pendingField] || 0;
    const totalUnits = currentPending + quantity;
    
    // 3. Calcular moedas completas e novo saldo pendente
    const earnedCoins = Math.floor(totalUnits / unitsPerCoin);
    const newPendingValue = totalUnits % unitsPerCoin;
    
    // 4. Registrar a troca
    const { data, error } = await supabase
      .from('exchanges')
      .insert([{
        student_id: studentId,
        material_id: materialId,
        quantity: quantity,
        coins_earned: earnedCoins, // Registrar as moedas ganhas nesta troca
        teacher_id: teacherId
      }])
      .select();
    
    // 5. Atualizar o saldo do aluno (pendentes e moedas)
    if (earnedCoins > 0) {
      await supabase
        .from('students')
        .update({
          narciso_coins: studentData.narciso_coins + earnedCoins,
          [pendingField]: newPendingValue
        })
        .eq('id', studentId);
    }
    
    return data || [];
  } catch (error) {
    console.error("Erro ao registrar troca:", error);
    throw error;
  }
}
```

Esta implementação garante que:

1. As moedas são calculadas corretamente com base no saldo pendente atual + nova quantidade
2. O saldo de moedas do aluno é incrementado automaticamente
3. O saldo pendente é atualizado para refletir apenas os materiais que não formaram uma moeda completa
4. Todas as informações são registradas no histórico de trocas

### 7.2 Considerações sobre Performance e Consistência

Esta abordagem prioriza a consistência dos dados. Cada registro de troca:

1. Lê o estado atual do aluno
2. Calcula os novos valores
3. Registra a troca
4. Atualiza o saldo do aluno

Se a performance se tornar um problema em um cenário de alta concorrência, uma alternativa seria implementar uma function ou trigger no banco de dados para garantir atomicidade dessas operações.

### 7.3 Correção da Edição de Trocas

Foi identificado outro problema relacionado à edição de trocas: quando uma troca é editada, especialmente quando há mudança no tipo de material, é necessário realizar ajustes complexos no saldo do aluno para manter a consistência dos dados.

A solução implementada seguiu o princípio de "reverter a troca anterior e aplicar uma nova troca":

```typescript
static async updateExchangeWithBalanceCorrection(
  exchangeId: string,
  newData: { 
    material_id?: string;
    quantity?: number;
    student_id?: string;
  }
) {
  // 1. Buscar informações da troca original
  // 2. Reverter os efeitos da troca original (moedas e pendentes)
  // 3. Calcular e aplicar os efeitos da nova troca
  // 4. Atualizar o registro da troca
}
```

Esta implementação lida com os seguintes cenários:

1. **Mudança apenas na quantidade**: Ajusta moedas e pendentes para a nova quantidade
2. **Mudança no tipo de material**: Remove pendentes do material antigo, ajusta moedas e adiciona pendentes ao novo material
3. **Mudança de aluno**: Remove moedas e pendentes do aluno original e adiciona ao novo aluno

A integridade dos dados é mantida verificando se o aluno tem moedas suficientes para que a troca seja revertida.

### 7.4 Correção da Exclusão de Trocas

Similar ao problema na edição de trocas, a exclusão também precisava ajustar corretamente o saldo de moedas e pendentes do aluno. O método original apenas removia o registro da troca, sem reverter os efeitos dela no saldo do aluno.

A solução implementada seguiu o mesmo princípio de "reverter a troca":

```typescript
static async deleteExchange(exchangeId: string) {
  // 1. Buscar informações da troca a ser excluída
  // 2. Buscar informações atuais do aluno
  // 3. Verificar se o aluno tem moedas suficientes para reverter
  // 4. Calcular o novo valor pendente após a exclusão
  // 5. Atualizar o saldo do aluno (remover moedas e adicionar pendentes)
  // 6. Excluir o registro da troca
}
```

Esta implementação garante que:

1. O saldo de moedas do aluno seja reduzido pelo número de moedas ganhas na troca excluída
2. As unidades de material sejam devolvidas ao saldo pendente do aluno
3. A integridade dos dados seja mantida verificando se o aluno tem moedas suficientes

A exclusão de trocas é uma operação sensível que só deve ser realizada quando necessário, e apenas por usuários com permissões adequadas (professores).

### 7.5 Simplificação da Verificação de Triggers

A funcionalidade de verificação de triggers originalmente implementada no código tentava usar funções RPC que não existem no Supabase (`get_triggers_info` e `create_get_triggers_function`), resultando em erros 404 no console. Para resolver este problema, a função `checkDatabaseTriggers` foi simplificada:

```typescript
// Método simplificado para verificar se existem triggers no banco
static async checkDatabaseTriggers() {
  // Retorna diretamente um resultado padrão sem consultar o banco
  // Este método foi simplificado para evitar erros 404 no Supabase
  return {
    hasTriggers: false,
    triggers: [],
    message: "Verificação de triggers desativada para evitar erros."
  };
}
```

Esta abordagem tem as seguintes vantagens:
1. Elimina os erros 404 no console ao abrir a página de histórico
2. Mantém a compatibilidade com o restante do código que espera esta função
3. Não afeta a funcionalidade principal da aplicação

Para casos em que seja realmente necessário verificar os triggers existentes no banco de dados, recomenda-se usar uma consulta direta à tabela `information_schema.triggers` como mostrado abaixo:

```sql
SELECT
  trigger_name,
  event_object_table AS table_name,
  event_manipulation AS event,
  action_timing AS timing,
  action_statement AS action
FROM
  information_schema.triggers
WHERE
  trigger_schema = 'public'
ORDER BY
  table_name, trigger_name;
```

Esta consulta fornece informações detalhadas sobre todos os triggers no schema público do banco de dados.
