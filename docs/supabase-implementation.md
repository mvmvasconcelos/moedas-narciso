# Guia de Implementação do Supabase

Este guia contém instruções para migrar o armazenamento local (localStorage) para o Supabase em uma futura atualização do projeto moedas-narciso.

## Configurando o Supabase

1. Crie uma conta no [Supabase](https://supabase.com/)
2. Crie um novo projeto
3. Obtenha as credenciais de API (URL e chave anônima)
4. Crie as variáveis de ambiente no projeto:

```
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
```

## Criando as tabelas no Supabase

Execute os seguintes comandos SQL no editor SQL do Supabase:

```sql
-- Tabela de usuários (professores)
CREATE TABLE teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Tabela de alunos
CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR NOT NULL,
  class_name VARCHAR NOT NULL,
  gender VARCHAR NOT NULL,
  narciso_coins INTEGER DEFAULT 0,
  teacher_id UUID REFERENCES teachers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Tabela de contribuições
CREATE TABLE contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  material_type VARCHAR NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Tabelas de configurações (para unidades por moeda etc.)
CREATE TABLE settings (
  key VARCHAR PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);
```

## Modificando o DataService

O arquivo `src/lib/dataService.ts` já contém um exemplo de implementação do Supabase comentado. Para implementá-lo:

1. Instale as dependências:

```bash
npm install @supabase/supabase-js
```

2. Ative o código comentado no arquivo `dataService.ts`
3. Implemente a migração dos dados do localStorage para o Supabase
4. Atualize o `AuthContext.tsx` para usar a classe `SupabaseDataService` em vez de `DataService`

## Migrando os dados existentes

Para migrar os dados do localStorage para o Supabase, adicione esta função na classe `SupabaseDataService`:

```typescript
static async migrateLocalStorageToSupabase() {
  try {
    // Obter dados do localStorage
    const localStudents = DataService.getStudents();
    
    // Verificar se há um usuário autenticado no Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado. Faça login primeiro.");
    }
    
    // Inserir cada aluno no Supabase
    for (const student of localStudents) {
      await this.addStudent({
        ...student,
        teacher_id: user.id
      });
      
      // Adicionar contribuições históricas
      if (student.contributions) {
        for (const [materialType, quantity] of Object.entries(student.contributions)) {
          if (quantity > 0) {
            await supabase.from('contributions').insert({
              student_id: student.id,
              material_type: materialType,
              quantity
            });
          }
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao migrar dados:", error);
    return { success: false, error };
  }
}
```

## Autenticação com Supabase

Para implementar a autenticação com Supabase:

1. Atualize o formulário de login para usar o `SupabaseDataService.signIn`
2. Implemente a verificação de autenticação no carregamento da página
3. Atualize o middleware de autenticação ou componente `ProtectedRoute` para verificar a autenticação do Supabase

## Benefícios da migração para o Supabase

1. **Persistência de dados**: Os dados ficam armazenados no servidor e não apenas no navegador do usuário
2. **Sincronização entre dispositivos**: Professores podem acessar os dados de qualquer dispositivo
3. **Backup automático**: Os dados são automaticamente salvos e têm backup
4. **Escalabilidade**: Suporte a múltiplos usuários e volumes maiores de dados
5. **Autenticação segura**: Sistema de autenticação mais robusto
6. **Consultas em tempo real**: Possibilidade de implementar atualizações em tempo real

## Considerações de desempenho

Ao migrar para o Supabase, considere:

1. Implementar caching dos dados mais acessados
2. Usar consultas otimizadas com índices adequados
3. Implementar loading states para operações assíncronas
4. Considerar uso de React Query ou SWR para gerenciar estados de cache e revalidação
