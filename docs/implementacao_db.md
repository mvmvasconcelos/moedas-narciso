# Guia de Implementação do Sistema com Supabase

Este guia fornece instruções detalhadas para implementar o novo sistema usando o banco de dados Supabase já configurado, incluindo a mudança de terminologia de "Contribuições" para "Trocas" e demais ajustes necessários.

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Etapa 1: Mudanças de Interface](#etapa-1-mudanças-de-interface)
3. [Etapa 2: Atualização de Componentes](#etapa-2-atualização-de-componentes)
4. [Etapa 3: Integração com Views e Triggers](#etapa-3-integração-com-views-e-triggers)
5. [Etapa 4: Implementação de Novas Features](#etapa-4-implementação-de-novas-features)
6. [Etapa 5: Testes e Validação](#etapa-5-testes-e-validação)

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
      .from('v_students_effective_values')
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

### 3.1 Componentes de Ranking

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

### 3.2 Dashboard e Estatísticas

> O dashboard é integrado com views específicas para mostrar estatísticas em tempo real do sistema.

```typescript
// src/app/dashboard/page.tsx
async function getDashboardStats() {
  const { data: stats } = await supabase
    .from('v_general_stats')
    .select('*')
    .single();

  return stats;
}
```

## Etapa 4: Implementação de Novas Features

### 4.1 Upload de Fotos dos Alunos

> O sistema de fotos utiliza o Storage do Supabase para armazenar e gerenciar imagens dos alunos de forma segura.

```typescript
// src/lib/dataService.ts
async function uploadStudentPhoto(studentId: string, file: File) {
  const fileExt = file.name.split('.').pop();
  const filePath = `${studentId}.${fileExt}`;

  const { error: uploadError } = await supabase
    .storage
    .from('student-photos')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from('students')
    .update({ 
      photo_url: `${supabaseUrl}/storage/v1/object/public/student-photos/${filePath}`
    })
    .eq('id', studentId);

  if (updateError) throw updateError;
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

- [ ] Autenticação e roles funcionando
- [ ] Views retornando dados corretamente
- [ ] Sistema de trocas implementado 
- [ ] Upload de fotos funcionando
- [ ] Ajustes manuais restritos a professores
- [ ] RLS e políticas funcionando
- [ ] Interface atualizada com nova terminologia
- [ ] Testes de performance realizados
- [ ] Documentação atualizada

## Observações Importantes

1. SEMPRE usar a view `v_students_effective_values` para valores atuais dos alunos
2. NÃO modificar diretamente os campos de saldo
3. USAR o sistema de ajustes para correções
4. MANTER logs de todas as operações
5. TESTAR em ambiente de desenvolvimento primeiro
