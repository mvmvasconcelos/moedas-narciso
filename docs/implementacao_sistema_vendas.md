# Implementação do Sistema de Vendas - Projeto Narciso Coins

Este documento detalha a implementação do sistema de vendas para o projeto "Narciso Coins", permitindo que os alunos gastem suas moedas em itens da lojinha escolar.

## 1. Análise da Arquitetura Atual

### 1.1. Estrutura Existente Relevante

O sistema atual possui uma arquitetura bem definida com:

- **Tabela `students`**: Contém os saldos de moedas (`narciso_coins`) e campos de ajuste (`adjustment_narciso_coins`)
- **Tabela `exchanges`**: Registra as "entradas" de moedas (materiais → moedas)
- **Sistema de Triggers**: Mantém totais sincronizados automaticamente
- **Views Consolidadas**: Fornecem dados pré-processados (`v_students_effective_values`, `v_student_list`)
- **RLS (Row Level Security)**: Controla acesso baseado em papéis (`teacher`, `student_helper`)

### 1.2. Necessidades Identificadas

1. **Registrar Saídas de Moedas**: Complementar o sistema atual que só registra entradas
2. **Histórico de Vendas**: Manter rastreabilidade de todos os gastos
3. **Saldo Atual vs. Total Histórico**: Separar total ganho do saldo disponível
4. **Simplicidade**: Interface simples para registrar vendas (aluno + valor + descrição)

## 2. Proposta de Implementação

### 2.1. Nova Tabela: `sales` (Vendas/Gastos)

A tabela principal para registrar as saídas de moedas:

```sql
CREATE TABLE public.sales (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    coins_spent integer NOT NULL,
    item_description text NOT NULL,
    sale_date timestamp with time zone NOT NULL DEFAULT now(),
    teacher_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

**Justificativa da Estrutura:**
- **`id`**: Chave primária padrão do sistema
- **`student_id`**: Referência ao aluno que fez a compra
- **`coins_spent`**: Quantidade de moedas gastas (sempre positivo)
- **`item_description`**: Descrição livre do item comprado (flexibilidade máxima)
- **`sale_date`**: Data/hora da venda (pode ser diferente de `created_at`)
- **`teacher_id`**: Professor/ajudante responsável pela venda (auditoria)
- **`created_at`**: Timestamp de criação do registro

### 2.2. Extensão da Tabela `students`

Adicionar um campo para cache do total de moedas gastas:

```sql
ALTER TABLE public.students 
ADD COLUMN total_coins_spent integer NOT NULL DEFAULT 0;
```

**Justificativa:**
- Mantém o padrão existente de campos `total_*` para cache
- Evita cálculos pesados em consultas frequentes
- Facilita relatórios e rankings

### 2.3. Novas Views para Saldos Atuais

#### View: `v_students_current_balance`
Substitui/complementa as views existentes mostrando o saldo atual disponível:

```sql
CREATE OR REPLACE VIEW public.v_students_current_balance WITH (security_invoker=on) AS
SELECT 
    s.id,
    s.name,
    s.class_id,
    c.name AS class_name,
    s.gender,
    s.photo_url,
    -- Saldos efetivos (base + ajustes)
    s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0) AS total_coins_earned,
    s.total_coins_spent,
    -- Saldo atual disponível
    (s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) - s.total_coins_spent AS current_coin_balance,
    -- Materiais pendentes (inalterados)
    s.pending_tampas + COALESCE(s.adjustment_pending_tampas, 0) AS pending_tampas,
    s.pending_latas + COALESCE(s.adjustment_pending_latas, 0) AS pending_latas,
    s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0) AS pending_oleo,
    -- Flags para identificar alunos com ajustes ou gastos
    CASE WHEN s.total_coins_spent > 0 THEN true ELSE false END AS has_spent_coins,
    CASE WHEN COALESCE(s.adjustment_narciso_coins, 0) <> 0 THEN true ELSE false END AS has_coin_adjustments
FROM students s
JOIN classes c ON s.class_id = c.id
ORDER BY s.name;
```

#### View: `v_sales_history`
Para consultar o histórico completo de vendas:

```sql
CREATE OR REPLACE VIEW public.v_sales_history WITH (security_invoker=on) AS
SELECT 
    sa.id,
    st.name AS student_name,
    c.name AS class_name,
    sa.coins_spent,
    sa.item_description,
    sa.sale_date,
    t.name AS teacher_name,
    sa.created_at
FROM sales sa
JOIN students st ON sa.student_id = st.id
JOIN classes c ON st.class_id = c.id
JOIN teachers t ON sa.teacher_id = t.id
ORDER BY sa.sale_date DESC;
```

### 2.4. Atualização das Views Existentes

#### Modificação da `v_student_list`
Adicionar informações de saldo atual:

```sql
CREATE OR REPLACE VIEW public.v_student_list WITH (security_invoker=on) AS
SELECT s.id,
    s.name,
    s.gender,
    c.name AS class_name,
    -- Total de moedas ganhas (histórico completo)
    s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0) AS total_coins_earned,
    -- Total de moedas gastas
    s.total_coins_spent,
    -- Saldo atual disponível
    (s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) - s.total_coins_spent AS current_coin_balance,
    -- Materiais trocados (histórico)
    COALESCE(t.total_tampas, 0::bigint) AS exchange_tampas,
    COALESCE(l.total_latas, 0::bigint) AS exchange_latas,
    COALESCE(o.total_oleo, 0::bigint) AS exchange_oleo,
    -- Materiais pendentes
    s.pending_tampas + COALESCE(s.adjustment_pending_tampas, 0) AS pending_tampas,
    s.pending_latas + COALESCE(s.adjustment_pending_latas, 0) AS pending_latas,
    s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0) AS pending_oleo,
    s.photo_url
FROM students s
JOIN classes c ON s.class_id = c.id
-- Subqueries existentes inalteradas
LEFT JOIN (
    SELECT exchanges.student_id, sum(exchanges.quantity) AS total_tampas
    FROM exchanges
    WHERE exchanges.material_id::text = 'tampas'::text
    GROUP BY exchanges.student_id
) t ON s.id = t.student_id
LEFT JOIN (
    SELECT exchanges.student_id, sum(exchanges.quantity) AS total_latas
    FROM exchanges
    WHERE exchanges.material_id::text = 'latas'::text
    GROUP BY exchanges.student_id
) l ON s.id = l.student_id
LEFT JOIN (
    SELECT exchanges.student_id, sum(exchanges.quantity) AS total_oleo
    FROM exchanges
    WHERE exchanges.material_id::text = 'oleo'::text
    GROUP BY exchanges.student_id
) o ON s.id = o.student_id
ORDER BY s.name;
```

#### Modificação da `v_general_stats`
Incluir estatísticas de vendas:

```sql
CREATE OR REPLACE VIEW public.v_general_stats WITH (security_invoker=on) AS
SELECT 
    -- Estatísticas de alunos
    COUNT(DISTINCT s.id) AS total_students,
    COUNT(DISTINCT s.class_id) AS total_classes,
    
    -- Estatísticas de moedas
    COALESCE(SUM(s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)), 0) AS total_coins_earned,
    COALESCE(SUM(s.total_coins_spent), 0) AS total_coins_spent,
    COALESCE(SUM((s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) - s.total_coins_spent), 0) AS total_coins_available,
    
    -- Estatísticas de materiais (inalteradas)
    COALESCE(SUM(s.pending_tampas + COALESCE(s.adjustment_pending_tampas, 0)), 0) AS total_pending_tampas,
    COALESCE(SUM(s.pending_latas + COALESCE(s.adjustment_pending_latas, 0)), 0) AS total_pending_latas,
    COALESCE(SUM(s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0)), 0) AS total_pending_oleo,
    
    -- Estatísticas de trocas
    COALESCE(COUNT(e.id), 0) AS total_exchanges,
    
    -- Estatísticas de vendas
    COALESCE(COUNT(sa.id), 0) AS total_sales
    
FROM students s
LEFT JOIN exchanges e ON s.id = e.student_id
LEFT JOIN sales sa ON s.id = sa.student_id;
```

### 2.5. Nova View: Rankings com Saldo Atual

```sql
CREATE OR REPLACE VIEW public.v_student_current_coin_ranking WITH (security_invoker=on) AS
SELECT 
    s.id,
    s.name,
    c.name AS class_name,
    (s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) - s.total_coins_spent AS current_coin_balance,
    s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0) AS total_coins_earned,
    s.total_coins_spent,
    ROW_NUMBER() OVER (ORDER BY ((s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) - s.total_coins_spent) DESC, s.name ASC) AS ranking_position
FROM students s
JOIN classes c ON s.class_id = c.id
WHERE (s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) - s.total_coins_spent >= 0
ORDER BY current_coin_balance DESC, s.name ASC;
```

## 3. Automação e Triggers

### 3.1. Função para Atualizar Total de Moedas Gastas

```sql
CREATE OR REPLACE FUNCTION update_student_coins_spent()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualiza o total de moedas gastas para o aluno
    UPDATE students 
    SET 
        total_coins_spent = COALESCE((
            SELECT SUM(coins_spent) 
            FROM sales 
            WHERE student_id = NEW.student_id
        ), 0),
        updated_at = NOW()
    WHERE id = NEW.student_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3.2. Trigger para Sincronizar Vendas

```sql
CREATE TRIGGER update_student_coins_spent_on_sale
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_student_coins_spent();
```

### 3.3. Função de Validação de Saldo (Opcional)

```sql
CREATE OR REPLACE FUNCTION validate_sufficient_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance integer;
BEGIN
    -- Calcula o saldo atual do aluno
    SELECT 
        (narciso_coins + COALESCE(adjustment_narciso_coins, 0)) - total_coins_spent
    INTO current_balance
    FROM students 
    WHERE id = NEW.student_id;
    
    -- Verifica se há saldo suficiente
    IF current_balance < NEW.coins_spent THEN
        RAISE EXCEPTION 'Saldo insuficiente. Saldo atual: %, Tentativa de gasto: %', 
            current_balance, NEW.coins_spent;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar antes de inserir
CREATE TRIGGER validate_sale_balance
    BEFORE INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION validate_sufficient_balance();
```

## 4. Políticas de Segurança (RLS)

### 4.1. Habilitar RLS na Tabela Sales

```sql
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
```

### 4.2. Políticas de Acesso

```sql
-- Professores podem gerenciar todas as vendas
CREATE POLICY "Teachers can manage all sales" ON public.sales
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.teachers t
        WHERE t.id = auth.uid() AND t.role = 'teacher'
    )
);

-- Ajudantes podem criar vendas
CREATE POLICY "Student helpers can create sales" ON public.sales
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.teachers t
        WHERE t.id = auth.uid() AND t.role IN ('teacher', 'student_helper')
    )
);

-- Usuários autenticados podem ver o histórico de vendas
CREATE POLICY "Authenticated users can view sales history" ON public.sales
FOR SELECT USING (auth.uid() IS NOT NULL);
```

## 5. Impactos no Frontend

### 5.1. Componentes Necessários

1. **Formulário de Venda** (`SaleForm.tsx`)
   - Seletor de aluno (com saldo atual visível)
   - Input para quantidade de moedas
   - Input para descrição do item
   - Validação de saldo suficiente

2. **Histórico de Vendas** (`SalesHistory.tsx`)
   - Listagem de todas as vendas
   - Filtros por aluno, data, professor
   - Exportação para relatórios

3. **Atualização dos Componentes Existentes**
   - `StudentsTable.tsx`: Adicionar coluna "Saldo Atual"
   - `StatCard.tsx`: Incluir estatísticas de vendas
   - Rankings: Mostrar saldo atual vs. total histórico

### 5.2. Alterações no Service Layer

```typescript
// src/lib/dataService.ts - Novas funções necessárias

export interface Sale {
  id: string;
  student_id: string;
  coins_spent: number;
  item_description: string;
  sale_date: string;
  teacher_id: string;
  created_at: string;
}

export interface StudentCurrentBalance {
  id: string;
  name: string;
  class_name: string;
  total_coins_earned: number;
  total_coins_spent: number;
  current_coin_balance: number;
  pending_tampas: number;
  pending_latas: number;
  pending_oleo: number;
  photo_url?: string;
}

// Criar venda
export async function createSale(sale: Omit<Sale, 'id' | 'created_at'>): Promise<Sale> {
  // Implementação
}

// Buscar saldos atuais dos alunos
export async function getCurrentBalances(): Promise<StudentCurrentBalance[]> {
  // Implementação usando v_students_current_balance
}

// Buscar histórico de vendas
export async function getSalesHistory(filters?: {
  student_id?: string;
  teacher_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<Sale[]> {
  // Implementação usando v_sales_history
}
```

## 6. Migração e Implementação

### 6.1. Ordem de Execução

1. **Backup do banco de dados atual**
2. **Criar tabela `sales`**
3. **Adicionar campo `total_coins_spent` em `students`**
4. **Criar funções e triggers**
5. **Criar/atualizar views**
6. **Configurar políticas RLS**
7. **Testar com dados de exemplo**
8. **Implementar frontend**

### 6.2. Script de Migração de Dados (Se Necessário)

```sql
-- Se já existirem vendas manuais registradas de outra forma,
-- este script pode ser adaptado para migrar os dados:

-- Exemplo: Se as vendas estavam sendo registradas como ajustes negativos
INSERT INTO sales (student_id, coins_spent, item_description, teacher_id, sale_date)
SELECT 
    student_id,
    ABS(adjustment_value) as coins_spent,
    COALESCE(reason, 'Migração de dados - venda anterior') as item_description,
    teacher_id,
    created_at as sale_date
FROM student_adjustments 
WHERE adjustment_type = 'narciso_coins' 
AND adjustment_value < 0;
```

## 7. Considerações e Limitações

### 7.1. Pontos Positivos
- ✅ Mantém compatibilidade total com sistema atual
- ✅ Histórico completo preservado
- ✅ Simplicidade de uso (formulário básico)
- ✅ Auditoria completa das vendas
- ✅ Performance otimizada com caching

### 7.2. Limitações Conhecidas
- ⚠️ Não há controle de estoque (por design)
- ⚠️ Não há sistema de produtos pré-cadastrados
- ⚠️ Vendas não podem ser "canceladas" diretamente (apenas ajustes)

### 7.3. Possíveis Extensões Futuras
- Sistema de produtos/itens pré-cadastrados
- Controle básico de estoque
- Relatórios avançados de vendas
- Sistema de "devoluções" ou cancelamentos

---

## 8. Scripts SQL para Implementação

A seguir estão todos os comandos SQL necessários para implementar o sistema de vendas no Supabase:

### 8.1. Criação da Tabela `sales`

```sql
-- Criar tabela sales
CREATE TABLE public.sales (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    coins_spent integer NOT NULL,
    item_description text NOT NULL,
    sale_date timestamp with time zone NOT NULL DEFAULT now(),
    teacher_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT sales_pkey PRIMARY KEY (id),
    CONSTRAINT sales_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT sales_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
    CONSTRAINT sales_coins_spent_positive CHECK (coins_spent > 0)
);

-- Criar índices para performance
CREATE INDEX idx_sales_student_id ON public.sales(student_id);
CREATE INDEX idx_sales_teacher_id ON public.sales(teacher_id);
CREATE INDEX idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX idx_sales_created_at ON public.sales(created_at);
```

### 8.2. Alteração da Tabela `students`

```sql
-- Adicionar campo total_coins_spent
ALTER TABLE public.students 
ADD COLUMN total_coins_spent integer NOT NULL DEFAULT 0;

-- Criar índice para o novo campo
CREATE INDEX idx_students_total_coins_spent ON public.students(total_coins_spent);
```

### 8.3. Funções e Triggers

```sql
-- Função para atualizar total de moedas gastas
CREATE OR REPLACE FUNCTION update_student_coins_spent()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE students 
    SET 
        total_coins_spent = COALESCE((
            SELECT SUM(coins_spent) 
            FROM sales 
            WHERE student_id = NEW.student_id
        ), 0),
        updated_at = NOW()
    WHERE id = NEW.student_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar vendas
CREATE TRIGGER update_student_coins_spent_on_sale
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_student_coins_spent();

-- Função de validação de saldo
CREATE OR REPLACE FUNCTION validate_sufficient_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance integer;
BEGIN
    SELECT 
        (narciso_coins + COALESCE(adjustment_narciso_coins, 0)) - total_coins_spent
    INTO current_balance
    FROM students 
    WHERE id = NEW.student_id;
    
    IF current_balance < NEW.coins_spent THEN
        RAISE EXCEPTION 'Saldo insuficiente. Saldo atual: %, Tentativa de gasto: %', 
            current_balance, NEW.coins_spent;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar saldo antes de venda
CREATE TRIGGER validate_sale_balance
    BEFORE INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION validate_sufficient_balance();
```

### 8.4. Criação e Atualização de Views

```sql
-- View para saldos atuais dos alunos
CREATE OR REPLACE VIEW public.v_students_current_balance WITH (security_invoker=on) AS
SELECT 
    s.id,
    s.name,
    s.class_id,
    c.name AS class_name,
    s.gender,
    s.photo_url,
    s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0) AS total_coins_earned,
    s.total_coins_spent,
    (s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) - s.total_coins_spent AS current_coin_balance,
    s.pending_tampas + COALESCE(s.adjustment_pending_tampas, 0) AS pending_tampas,
    s.pending_latas + COALESCE(s.adjustment_pending_latas, 0) AS pending_latas,
    s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0) AS pending_oleo,
    CASE WHEN s.total_coins_spent > 0 THEN true ELSE false END AS has_spent_coins,
    CASE WHEN COALESCE(s.adjustment_narciso_coins, 0) <> 0 THEN true ELSE false END AS has_coin_adjustments
FROM students s
JOIN classes c ON s.class_id = c.id
ORDER BY s.name;

-- View para histórico de vendas
CREATE OR REPLACE VIEW public.v_sales_history WITH (security_invoker=on) AS
SELECT 
    sa.id,
    st.name AS student_name,
    c.name AS class_name,
    sa.coins_spent,
    sa.item_description,
    sa.sale_date,
    t.name AS teacher_name,
    sa.created_at
FROM sales sa
JOIN students st ON sa.student_id = st.id
JOIN classes c ON st.class_id = c.id
JOIN teachers t ON sa.teacher_id = t.id
ORDER BY sa.sale_date DESC;

-- Atualizar view v_student_list para incluir saldo atual
CREATE OR REPLACE VIEW public.v_student_list WITH (security_invoker=on) AS
SELECT s.id,
    s.name,
    s.gender,
    c.name AS class_name,
    s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0) AS total_coins_earned,
    s.total_coins_spent,
    (s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) - s.total_coins_spent AS current_coin_balance,
    COALESCE(t.total_tampas, 0::bigint) AS exchange_tampas,
    COALESCE(l.total_latas, 0::bigint) AS exchange_latas,
    COALESCE(o.total_oleo, 0::bigint) AS exchange_oleo,
    s.pending_tampas + COALESCE(s.adjustment_pending_tampas, 0) AS pending_tampas,
    s.pending_latas + COALESCE(s.adjustment_pending_latas, 0) AS pending_latas,
    s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0) AS pending_oleo,
    s.photo_url
FROM students s
JOIN classes c ON s.class_id = c.id
LEFT JOIN (
    SELECT exchanges.student_id, sum(exchanges.quantity) AS total_tampas
    FROM exchanges
    WHERE exchanges.material_id::text = 'tampas'::text
    GROUP BY exchanges.student_id
) t ON s.id = t.student_id
LEFT JOIN (
    SELECT exchanges.student_id, sum(exchanges.quantity) AS total_latas
    FROM exchanges
    WHERE exchanges.material_id::text = 'latas'::text
    GROUP BY exchanges.student_id
) l ON s.id = l.student_id
LEFT JOIN (
    SELECT exchanges.student_id, sum(exchanges.quantity) AS total_oleo
    FROM exchanges
    WHERE exchanges.material_id::text = 'oleo'::text
    GROUP BY exchanges.student_id
) o ON s.id = o.student_id
ORDER BY s.name;

-- View para ranking por saldo atual
CREATE OR REPLACE VIEW public.v_student_current_coin_ranking WITH (security_invoker=on) AS
SELECT 
    s.id,
    s.name,
    c.name AS class_name,
    (s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) - s.total_coins_spent AS current_coin_balance,
    s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0) AS total_coins_earned,
    s.total_coins_spent,
    ROW_NUMBER() OVER (ORDER BY ((s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) - s.total_coins_spent) DESC, s.name ASC) AS ranking_position
FROM students s
JOIN classes c ON s.class_id = c.id
WHERE (s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) - s.total_coins_spent >= 0
ORDER BY current_coin_balance DESC, s.name ASC;

-- Atualizar view de estatísticas gerais
CREATE OR REPLACE VIEW public.v_general_stats WITH (security_invoker=on) AS
SELECT 
    COUNT(DISTINCT s.id) AS total_students,
    COUNT(DISTINCT s.class_id) AS total_classes,
    COALESCE(SUM(s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)), 0) AS total_coins_earned,
    COALESCE(SUM(s.total_coins_spent), 0) AS total_coins_spent,
    COALESCE(SUM((s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) - s.total_coins_spent), 0) AS total_coins_available,
    COALESCE(SUM(s.pending_tampas + COALESCE(s.adjustment_pending_tampas, 0)), 0) AS total_pending_tampas,
    COALESCE(SUM(s.pending_latas + COALESCE(s.adjustment_pending_latas, 0)), 0) AS total_pending_latas,
    COALESCE(SUM(s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0)), 0) AS total_pending_oleo,
    (SELECT COUNT(*) FROM exchanges) AS total_exchanges,
    (SELECT COUNT(*) FROM sales) AS total_sales
FROM students s;
```

### 8.5. Políticas de Segurança (RLS)

```sql
-- Habilitar RLS na tabela sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Professores podem gerenciar todas as vendas
CREATE POLICY "Teachers can manage all sales" ON public.sales
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.teachers t
        WHERE t.id = auth.uid() AND t.role = 'teacher'
    )
);

-- Ajudantes podem criar vendas
CREATE POLICY "Student helpers can create sales" ON public.sales
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.teachers t
        WHERE t.id = auth.uid() AND t.role IN ('teacher', 'student_helper')
    )
);

-- Usuários autenticados podem ver o histórico de vendas
CREATE POLICY "Authenticated users can view sales history" ON public.sales
FOR SELECT USING (auth.uid() IS NOT NULL);
```

### 8.6. Script de Atualização dos Totais Existentes

```sql
-- Inicializar o campo total_coins_spent para todos os alunos existentes
-- (Como é um campo novo, todos começam com 0, que já é o padrão)
UPDATE students SET total_coins_spent = 0 WHERE total_coins_spent IS NULL;
```

### 8.7. Script de Teste (Opcional)

```sql
-- Exemplo de inserção de teste (remover em produção)
-- INSERT INTO sales (student_id, coins_spent, item_description, teacher_id)
-- SELECT 
--     s.id,
--     5,
--     'Item de teste',
--     t.id
-- FROM students s, teachers t 
-- WHERE s.name = 'Nome do Aluno de Teste' 
-- AND t.role = 'teacher' 
-- LIMIT 1;
```

---

## Conclusão

Esta implementação mantém a simplicidade desejada enquanto fornece todas as funcionalidades necessárias para o sistema de vendas. O design segue os padrões já estabelecidos no projeto, garantindo consistência e facilidade de manutenção.

**Próximos Passos Recomendados:**
1. Execute os scripts SQL na ordem apresentada
2. Teste com dados de exemplo
3. Implemente os componentes do frontend
4. Realize testes de integração
5. Documente o novo fluxo de trabalho para os usuários

**Lembre-se de sempre fazer backup do banco de dados antes de executar as modificações em produção.**
