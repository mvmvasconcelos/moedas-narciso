# Sistema de Vendas - Projeto Narciso Coins

Implementação simples para permitir que os alunos gastem suas moedas na lojinha escolar.

## Objetivo

Registrar vendas de itens da lojinha, descontando moedas do saldo dos alunos de forma simples e direta.

## Funcionalidades

- ✅ Registrar venda (aluno + quantidade de moedas + descrição do item)
- ✅ Visualizar saldo atual dos alunos (total ganho - total gasto)
- ✅ Histórico básico de vendas
- ✅ Validação de saldo suficiente

## Status da Implementação

### ✅ **CONCLUÍDO - Banco de Dados (08/08/2025)**
- ✅ Tabela `sales` criada com sucesso
- ✅ RLS configurado e funcionando
- ✅ View `v_student_list` atualizada com campo `current_coin_balance`
- ✅ Testes de funcionamento realizados

### ✅ **CONCLUÍDO - Backend (08/08/2025)**
- ✅ Interface `Sale` adicionada
- ✅ Função `createSale()` implementada
- ✅ Função `getSalesHistory()` implementada  
- ✅ Função `getStudentSales()` implementada (bônus)

### ✅ **CONCLUÍDO - Frontend (08/08/2025)**
- ✅ Componente `SaleForm.tsx` criado
- ✅ Página `/lojinha` implementada
- ✅ `StudentsTable.tsx` atualizada com coluna "Saldo Atual"
- ✅ Navegação "Lojinha" adicionada ao menu lateral
- ✅ Interface completa e funcional
- ✅ **CORREÇÃO (08/08/2025)**: Atualização automática de saldo após vendas implementada

## Implementação do Banco de Dados

### 1. Tabela de Vendas

Tabela simples para registrar as vendas:

```sql
CREATE TABLE public.sales (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    coins_spent integer NOT NULL, -- Validações feitas no sistema, não no banco
    item_description text NOT NULL,
    teacher_id uuid NOT NULL,
    sale_date timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT sales_pkey PRIMARY KEY (id),
    CONSTRAINT sales_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT sales_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- RLS básico
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage sales" ON public.sales
FOR ALL USING (auth.uid() IS NOT NULL);

-- AJUSTE: Remover restrições, validações ficam no sistema
ALTER TABLE public.sales 
DROP CONSTRAINT IF EXISTS sales_coins_spent_check;
```

### 2. Atualização da View de Alunos

Modificar a view existente para incluir saldo atual:

```sql
-- Atualizar v_student_list para incluir saldo atual (mantendo estrutura EXATA existente)
CREATE OR REPLACE VIEW public.v_student_list WITH (security_invoker=on) AS
SELECT s.id,
    s.name,
    s.gender,
    c.name AS class_name,
    s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0) AS effective_narciso_coins,
    COALESCE(t.total_tampas, 0::bigint) AS exchange_tampas,
    COALESCE(l.total_latas, 0::bigint) AS exchange_latas,
    COALESCE(o.total_oleo, 0::bigint) AS exchange_oleo,
    s.pending_tampas + COALESCE(s.adjustment_pending_tampas, 0) AS pending_tampas,
    s.pending_latas + COALESCE(s.adjustment_pending_latas, 0) AS pending_latas,
    s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0) AS pending_oleo,
    s.photo_url,
    -- NOVA COLUNA: Saldo atual disponível
    (s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) - 
    COALESCE((SELECT SUM(coins_spent) FROM sales WHERE student_id = s.id), 0) AS current_coin_balance
FROM students s
JOIN classes c ON s.class_id = c.id
LEFT JOIN (
    SELECT exchanges.student_id, sum(exchanges.quantity) AS total_tampas
    FROM exchanges WHERE exchanges.material_id::text = 'tampas'::text
    GROUP BY exchanges.student_id
) t ON s.id = t.student_id
LEFT JOIN (
    SELECT exchanges.student_id, sum(exchanges.quantity) AS total_latas
    FROM exchanges WHERE exchanges.material_id::text = 'latas'::text
    GROUP BY exchanges.student_id
) l ON s.id = l.student_id
LEFT JOIN (
    SELECT exchanges.student_id, sum(exchanges.quantity) AS total_oleo
    FROM exchanges WHERE exchanges.material_id::text = 'oleo'::text
    GROUP BY exchanges.student_id
) o ON s.id = o.student_id
ORDER BY s.name;
```

## Backend (dataService.ts)

Adicionar apenas estas funções simples:

```typescript
// Interface para venda
export interface Sale {
  student_id: string;
  coins_spent: number;
  item_description: string;
  teacher_id: string;
  sale_date?: string; // Opcional, usa now() se não fornecido
}

// Criar venda
export async function createSale(sale: Sale): Promise<void> {
  const { error } = await supabase
    .from('sales')
    .insert([sale]);
    
  if (error) throw error;
}

// Buscar histórico de vendas (opcional)
export async function getSalesHistory(): Promise<any[]> {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      id,
      coins_spent,
      item_description,
      sale_date,
      created_at,
      students(name),
      teachers(name)
    `)
    .order('sale_date', { ascending: false });
    
  if (error) throw error;
  return data || [];
}
```

## Frontend

### Componente de Venda Simples

```tsx
// SaleForm.tsx
export function SaleForm() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [coinsSpent, setCoinsSpent] = useState(0);
  const [description, setDescription] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]); // Data atual como padrão
  const { currentTeacher } = useAuth();
  
  const handleSubmit = async () => {
    if (!selectedStudent || coinsSpent <= 0 || !description.trim()) {
      alert('Preencha todos os campos!');
      return;
    }
    
    // Validação de saldo no frontend
    if (selectedStudent.narcisoCoins < coinsSpent) {
      alert('Saldo insuficiente!');
      return;
    }
    
    try {
      await createSale({
        student_id: selectedStudent.id,
        coins_spent: coinsSpent,
        item_description: description,
        teacher_id: currentTeacher.id,
        sale_date: new Date(saleDate).toISOString()
      });
      
      alert('Venda registrada com sucesso!');
      // Resetar formulário
      setSelectedStudent(null);
      setCoinsSpent(0);
      setDescription('');
      setSaleDate(new Date().toISOString().split('T')[0]);
      
    } catch (error) {
      alert('Erro ao registrar venda');
    }
  };
  
  return (
    <div className="space-y-4">
      <h2>Registrar Venda</h2>
      
      <StudentSelector onSelect={setSelectedStudent} />
      
      {selectedStudent && (
        <div className="space-y-4">
          <p>
            <strong>{selectedStudent.name}</strong> - 
            Saldo: {selectedStudent.narcisoCoins} moedas
          </p>
          
          <input 
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
          />
          
          <input 
            type="number" 
            placeholder="Quantidade de moedas"
            value={coinsSpent || ''}
            onChange={(e) => setCoinsSpent(Number(e.target.value))}
            max={selectedStudent.narcisoCoins}
            min={1}
          />
          
          <input 
            type="text"
            placeholder="O que foi comprado?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          
          <button onClick={handleSubmit}>
            Registrar Venda
          </button>
        </div>
      )}
    </div>
  );
}
```

### Atualizar StudentsTable

Adicionar coluna "Saldo Atual" na tabela de alunos:

```tsx
// Em StudentsTable.tsx, adicionar:
<TableHead>Saldo Atual</TableHead>

// E na linha de dados:
<TableCell>{student.current_coin_balance || 0} moedas</TableCell>
```

## Implementação Passo a Passo

### ✅ 1. Executar SQL no Supabase - **CONCLUÍDO**

✅ **Script executado com sucesso em 08/08/2025**

```sql
-- Criar tabela sales
CREATE TABLE public.sales (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    coins_spent integer NOT NULL, -- Validações feitas no sistema, não no banco
    item_description text NOT NULL,
    teacher_id uuid NOT NULL,
    sale_date timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT sales_pkey PRIMARY KEY (id),
    CONSTRAINT sales_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT sales_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- RLS básico
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage sales" ON public.sales
FOR ALL USING (auth.uid() IS NOT NULL);

-- AJUSTE: Remover restrições, validações ficam no sistema
ALTER TABLE public.sales 
DROP CONSTRAINT IF EXISTS sales_coins_spent_check;
```

### ✅ 2. Atualizar View de Alunos - **CONCLUÍDO**

✅ **View atualizada com sucesso - campo `current_coin_balance` disponível**

```sql
-- Atualizar v_student_list para incluir saldo atual (mantendo estrutura EXATA existente)
CREATE OR REPLACE VIEW public.v_student_list WITH (security_invoker=on) AS
SELECT s.id,
    s.name,
    s.gender,
    c.name AS class_name,
    s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0) AS effective_narciso_coins,
    COALESCE(t.total_tampas, 0::bigint) AS exchange_tampas,
    COALESCE(l.total_latas, 0::bigint) AS exchange_latas,
    COALESCE(o.total_oleo, 0::bigint) AS exchange_oleo,
    s.pending_tampas + COALESCE(s.adjustment_pending_tampas, 0) AS pending_tampas,
    s.pending_latas + COALESCE(s.adjustment_pending_latas, 0) AS pending_latas,
    s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0) AS pending_oleo,
    s.photo_url,
    -- NOVA COLUNA: Saldo atual disponível
    (s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) - 
    COALESCE((SELECT SUM(coins_spent) FROM sales WHERE student_id = s.id), 0) AS current_coin_balance
FROM students s
JOIN classes c ON s.class_id = c.id
LEFT JOIN (
    SELECT exchanges.student_id, sum(exchanges.quantity) AS total_tampas
    FROM exchanges WHERE exchanges.material_id::text = 'tampas'::text
    GROUP BY exchanges.student_id
) t ON s.id = t.student_id
LEFT JOIN (
    SELECT exchanges.student_id, sum(exchanges.quantity) AS total_latas
    FROM exchanges WHERE exchanges.material_id::text = 'latas'::text
    GROUP BY exchanges.student_id
) l ON s.id = l.student_id
LEFT JOIN (
    SELECT exchanges.student_id, sum(exchanges.quantity) AS total_oleo
    FROM exchanges WHERE exchanges.material_id::text = 'oleo'::text
    GROUP BY exchanges.student_id
) o ON s.id = o.student_id
ORDER BY s.name;
```

### 🔄 3. Atualizar dataService.ts - **CONCLUÍDO**

✅ **Funções de vendas implementadas em 08/08/2025:**
- ✅ Interface `Sale` 
- ✅ `createSale()` - Registra nova venda
- ✅ `getSalesHistory()` - Histórico geral de vendas
- ✅ `getStudentSales()` - Vendas de um aluno específico

### ✅ 4. Criar SaleForm.tsx - **CONCLUÍDO**

✅ **Componente implementado em 08/08/2025:**
- ✅ Formulário completo de vendas com validações
- ✅ Seleção de aluno com componente reutilizável
- ✅ Validação de saldo em tempo real
- ✅ Interface responsiva e intuitiva

### ✅ 5. Atualizar StudentsTable.tsx - **CONCLUÍDO**

✅ **Tabela atualizada em 08/08/2025:**
- ✅ Nova coluna "Saldo Atual" com ordenação
- ✅ Interface do Student atualizada
- ✅ Mapeamento completo no DataService

### ✅ 6. Adicionar página/rota para vendas - **CONCLUÍDO**

✅ **Página da lojinha implementada em 08/08/2025:**
- ✅ Rota `/lojinha` criada e funcional
- ✅ Link "Lojinha" no menu lateral
- ✅ Histórico de vendas integrado
- ✅ Estatísticas em tempo real

## Características da Implementação

- ✅ **Simples**: Apenas 1 tabela nova + atualização de 1 view
- ✅ **Sem triggers**: Cálculo on-demand na consulta
- ✅ **Sem cache**: Evita complexidade de sincronização
- ✅ **Validação no frontend**: Mais responsivo
- ✅ **Compatível**: Não altera estruturas existentes
- ✅ **Escalável**: Funciona mesmo com muitos alunos

## Limitações Aceitas

- ⚠️ Vendas não podem ser "canceladas" pelo sistema (usar ajustes manuais)
- ⚠️ Não há catálogo de produtos (descrição livre)
- ⚠️ Cálculo de saldo a cada consulta (aceitável para o volume de dados)

## Como Fazer Ajustes/Correções

### ✅ **Situação: Registrou venda errada**

**1. Venda original (erro):**
```sql
-- João comprou algo por 20 moedas, mas foi registrado errado
INSERT INTO sales (student_id, coins_spent, item_description, teacher_id) 
VALUES ('joao_id', 20, 'Item registrado por engano', 'teacher_id');
```

**2. Correção (ajuste negativo):**
```sql
-- Devolver as 20 moedas com ajuste negativo
INSERT INTO sales (student_id, coins_spent, item_description, teacher_id) 
VALUES ('joao_id', -20, 'AJUSTE: Correção venda errada do dia XX/XX', 'teacher_id');
```

**Resultado:** As 20 moedas voltam para o saldo do João ✅

### ✅ **Situação: Valor errado**

**1. Venda com valor errado:**
```sql
-- Deveria ser 5 moedas, mas registrou 15
INSERT INTO sales (student_id, coins_spent, item_description, teacher_id) 
VALUES ('maria_id', 15, 'Lanche', 'teacher_id');
```

**2. Correção:**
```sql
-- Devolver a diferença (10 moedas)
INSERT INTO sales (student_id, coins_spent, item_description, teacher_id) 
VALUES ('maria_id', -10, 'AJUSTE: Correção valor lanche (era 5, não 15)', 'teacher_id');
```

**Resultado:** Maria fica com desconto correto de 5 moedas ✅

## Correções e Melhorias Implementadas

### ✅ **08/08/2025 - Atualização Automática de Saldo**

**Problema:** Após registrar uma venda, o saldo do aluno não era atualizado automaticamente na interface, sendo necessário recarregar a página (F5).

**Solução Implementada:**
1. Adicionada função `refreshStudents()` no `AuthContext` para recarregar dados dos estudantes
2. Chamada automática de `refreshStudents()` após conclusão de venda na página da lojinha
3. Interface agora mostra saldo atualizado imediatamente após cada transação

**Arquivos Alterados:**
- `src/contexts/AuthContext.tsx` - Nova função `refreshStudents()`
- `src/app/lojinha/page.tsx` - Chamada de atualização após venda

### ✅ **08/08/2025 - Permitir Valores Negativos para Correções**

**Problema:** O formulário de vendas não permitia valores negativos, impedindo correções e ajustes conforme planejado na documentação.

**Solução Implementada:**
1. Removida validação que impedia valores <= 0
2. Ajustada validação de saldo para aplicar apenas a vendas (valores positivos)
3. Permitidos valores negativos para devoluções e correções
4. Atualizada interface para indicar uso de valores negativos
5. Mensagens de sucesso adaptadas para vendas vs ajustes

**Arquivos Alterados:**
- `src/components/trocas/SaleForm.tsx` - Validações e interface atualizadas

**Como usar agora:**
- **Venda normal:** Valor positivo (ex: 10)
- **Correção/Devolução:** Valor negativo (ex: -10)
- **Descrição:** Use "AJUSTE:" para identificar correções

Esta implementação atende às necessidades básicas do projeto mantendo a simplicidade e facilidade de manutenção.
