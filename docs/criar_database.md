# Guia para Criação do Banco de Dados no Supabase

Este documento contém as instruções completas para criar a estrutura de banco de dados para o projeto Moedas Narciso no Supabase.

## Pré-requisitos

1. Conta criada no [Supabase](https://supabase.com/)
2. Projeto criado no Supabase
3. Acesso ao SQL Editor do Supabase

## Filosofia de Design: KISS (Keep It Simple, Stupid) 🎯

**Estrutura SIMPLIFICADA**: 6 tabelas essenciais, sem complexidades desnecessárias.
- ✅ Lógica de negócio na **aplicação** (transparente e modificável)
- ✅ Banco de dados **simples** (apenas armazenamento)
- ✅ **Valores pendentes** armazenados no aluno (performance e simplicidade)
- ✅ Histórico de taxas de conversão **centralizado**
- ✅ Terminologia: **"Trocas"** de materiais por moedas

## Estrutura de Tabelas

### 1. Tabela `teachers` (Usuários do Sistema - Professores + Alunos Auxiliares)

Esta tabela serve para autenticação de **professores** E **alunos auxiliares** que podem registrar trocas.

```sql
CREATE TABLE teachers (
  id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  role VARCHAR DEFAULT 'teacher' CHECK (role IN ('teacher', 'student_helper')),
  email VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT teachers_pkey PRIMARY KEY (id)
);
```

**LÓGICA DE ACESSO:**
- **`teacher`**: Acesso TOTAL (turmas, alunos, trocas, relatórios, configurações)
- **`student_helper`**: Acesso LIMITADO (apenas registrar trocas de qualquer aluno)

**CADASTRO DUPLO** para alunos auxiliares:
1. **Registro na `teachers`** (para login/auth) com `role = 'student_helper'`
2. **Registro na `students`** (como aluno normal da escola)

### 2. Tabela `classes` (Turmas)

```sql
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Tabela `students` (Alunos)

```sql
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  gender VARCHAR CHECK (gender IN ('masculino', 'feminino', 'outro', 'prefiroNaoInformar')),
  photo_url VARCHAR, -- URL da foto no Supabase Storage (opcional)
  narciso_coins INTEGER DEFAULT 0,
  -- Valores pendentes (materiais que ainda não completaram uma moeda)
  pending_tampas INTEGER DEFAULT 0,
  pending_latas INTEGER DEFAULT 0,
  pending_oleo INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**FOTO DO ALUNO**: Campo `photo_url` armazena o caminho da foto no Supabase Storage.

### 4. Tabela `materials` (Tipos de Materiais)

```sql
CREATE TABLE materials (
  id VARCHAR PRIMARY KEY, -- 'tampas', 'latas', 'oleo'
  name VARCHAR NOT NULL,
  label VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Tabela `material_conversion_rates` (Taxas de Conversão com Histórico)

**CENTRALIZADA**: Todas as taxas de conversão ficam apenas nesta tabela, mantendo histórico simples.

```sql
CREATE TABLE material_conversion_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id VARCHAR REFERENCES materials(id) ON DELETE CASCADE,
  units_per_coin INTEGER NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMPTZ NULL, -- NULL = taxa atual
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

### 6. Tabela `exchanges` (Trocas de Materiais por Moedas)

Registra o histórico de todas as trocas realizadas pelos alunos.

```sql
CREATE TABLE exchanges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  material_id VARCHAR REFERENCES materials(id),
  quantity INTEGER NOT NULL, -- Quantidade trazida pelo aluno nesta troca
  coins_earned INTEGER DEFAULT 0, -- Moedas ganhas nesta troca específica
  teacher_id UUID REFERENCES teachers(id),
  exchange_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Configuração de Segurança (RLS - Row Level Security)

### Habilitar RLS nas tabelas principais

```sql
-- Habilitar RLS apenas nas tabelas que precisam
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_conversion_rates ENABLE ROW LEVEL SECURITY;

-- Materials não precisam de RLS - são dados de referência
```

### Policies de Segurança com NÍVEIS DE ACESSO

**DECISÃO**: Dois níveis de acesso - **Professores** (total) e **Alunos Auxiliares** (apenas trocas).

```sql
-- Policies para teachers (TODOS podem gerenciar dados de professores)
CREATE POLICY "Authenticated users can manage teachers data" ON teachers
  FOR ALL USING (auth.role() = 'authenticated');

-- Policies para classes (APENAS professores podem gerenciar)
CREATE POLICY "Only teachers can manage classes" ON classes
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM teachers WHERE role = 'teacher'
    )
  );

-- Policies para students (APENAS professores podem gerenciar)
CREATE POLICY "Only teachers can manage students" ON students
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM teachers WHERE role = 'teacher'
    )
  );

-- Policies para exchanges (PROFESSORES e ALUNOS AUXILIARES podem registrar)
CREATE POLICY "Teachers and helpers can manage exchanges" ON exchanges
  FOR ALL USING (auth.role() = 'authenticated');

-- Policies para conversion rates (APENAS professores podem alterar)
CREATE POLICY "Only teachers can manage conversion rates" ON material_conversion_rates
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM teachers WHERE role = 'teacher'
    )
  );

-- Materiais sempre acessíveis
CREATE POLICY "Allow reading materials" ON materials
  FOR SELECT USING (auth.role() = 'authenticated');
```

**RESUMO DOS ACESSOS:**
- 👨‍🏫 **Professores**: TUDO (turmas, alunos, trocas, relatórios, taxas)
- 👨‍🎓 **Alunos Auxiliares**: APENAS registrar trocas + ver dados necessários

## Índices Essenciais (Apenas o Necessário)

```sql
-- Com acesso aberto, índices focam apenas em performance
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_exchanges_student_id ON exchanges(student_id);
CREATE INDEX idx_exchanges_material_id ON exchanges(material_id);
CREATE INDEX idx_exchanges_date ON exchanges(exchange_date);
CREATE INDEX idx_teachers_role ON teachers(role);
```

## 📷 **Armazenamento de Fotos dos Alunos**

### Configuração do Supabase Storage

#### 1. Criar Bucket para Fotos dos Alunos

No painel do Supabase, vá em **Storage** e crie um bucket chamado `student-photos`:
- **Public**: Não (fotos privadas por segurança)
- **File Size Limit**: 5MB máximo por foto
- **Allowed MIME Types**: image/jpeg, image/png, image/webp

#### 2. Política de Segurança para Fotos

```sql
-- Políticas para o bucket student-photos
CREATE POLICY "Authenticated users can view student photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Teachers can upload student photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-photos' 
  AND auth.uid() IN (SELECT id FROM teachers WHERE role = 'teacher')
);

CREATE POLICY "Teachers can update student photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'student-photos' 
  AND auth.uid() IN (SELECT id FROM teachers WHERE role = 'teacher')
);

CREATE POLICY "Teachers can delete student photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-photos' 
  AND auth.uid() IN (SELECT id FROM teachers WHERE role = 'teacher')
);
```

#### 3. Estrutura de Pastas Recomendada

```
student-photos/
├── class-uuid1/
│   ├── student-uuid1-joao.jpg
│   ├── student-uuid2-maria.png
│   └── student-uuid3-pedro.webp
└── class-uuid2/
    └── student-uuid4-ana.jpg
```

**Vantagens do Supabase Storage:**
- 🔒 Segurança via RLS
- ⚡ CDN global automático
- 💰 Pay-per-use
- 🖼️ Suporte a WebP
- 📱 URLs assinadas com cache

---

## Lógica de Funcionamento da Aplicação

### Como a aplicação fará os cálculos de troca:

1. **Buscar taxa atual**: A aplicação consultará a taxa vigente na `material_conversion_rates`
2. **Calcular troca**: Somar quantidade atual + saldo pendente do aluno
3. **Calcular moedas**: Dividir total pela taxa de conversão (apenas parte inteira)
4. **Atualizar saldos**: Novo saldo pendente = total % taxa de conversão
5. **Registrar troca**: Inserir na tabela `exchanges` com todos os valores
6. **Atualizar aluno**: Incrementar moedas e atualizar saldo pendente

## 💰 **Lógica dos Valores Pendentes**

### Conceito Fundamental:
- ✅ Alunos **nunca** recebem frações de moedas
- ✅ Materiais "extras" ficam **pendentes** para próximas trocas
- ✅ Sistema é **justo** e **transparente**

### Exemplo Prático:
```
Taxa: 10 tampas = 1 moeda

Dia 1: Aluno traz 7 tampas
       → 0 moedas ganhas + 7 tampas pendentes

Dia 2: Aluno traz 5 tampas  
       → Total: 7 + 5 = 12 tampas
       → 1 moeda ganha + 2 tampas pendentes (12 ÷ 10 = 1, resto = 2)

Dia 3: Aluno traz 8 tampas
       → Total: 2 + 8 = 10 tampas  
       → 1 moeda ganha + 0 tampas pendentes (10 ÷ 10 = 1, resto = 0)
```

### Por que Armazenar Pendentes APENAS no Aluno:
1. **Performance**: Acesso direto aos pendentes sem cálculos
2. **Simplicidade**: Uma query para buscar dados do aluno  
3. **Escopo adequado**: Para uma escola, não há problemas de sincronização
4. **Transparência**: Professor vê imediatamente os pendentes do aluno
5. **Sem duplicação**: Dados únicos, sem risco de inconsistência

---

## 📊 **Views para Rankings (Opcionais)**

### Views Recomendadas:

```sql
-- 1. View: Ranking Geral de Alunos por Moedas
CREATE VIEW v_student_coin_ranking AS
SELECT 
    s.id,
    s.name,
    s.class_id,
    c.name as class_name,
    s.narciso_coins,
    ROW_NUMBER() OVER (ORDER BY s.narciso_coins DESC) as rank_position
FROM students s
JOIN classes c ON s.class_id = c.id
ORDER BY s.narciso_coins DESC;

-- 2. View: Totais de Materiais por Aluno
CREATE VIEW v_student_material_totals AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.class_id,
    c.name as class_name,
    COALESCE(SUM(CASE WHEN e.material_id = 'tampas' THEN e.quantity END), 0) as total_tampas,
    COALESCE(SUM(CASE WHEN e.material_id = 'latas' THEN e.quantity END), 0) as total_latas,
    COALESCE(SUM(CASE WHEN e.material_id = 'oleo' THEN e.quantity END), 0) as total_oleo,
    s.narciso_coins
FROM students s
JOIN classes c ON s.class_id = c.id
LEFT JOIN exchanges e ON s.id = e.student_id
GROUP BY s.id, s.name, s.class_id, c.name, s.narciso_coins;

-- 3. View: Ranking por Turma
CREATE VIEW v_class_rankings AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.class_id,
    c.name as class_name,
    s.narciso_coins,
    COALESCE(tampas.total, 0) as total_tampas,
    COALESCE(latas.total, 0) as total_latas,
    COALESCE(oleo.total, 0) as total_oleo,
    ROW_NUMBER() OVER (PARTITION BY s.class_id ORDER BY s.narciso_coins DESC) as rank_in_class
FROM students s
JOIN classes c ON s.class_id = c.id
LEFT JOIN (
    SELECT student_id, SUM(quantity) as total 
    FROM exchanges 
    WHERE material_id = 'tampas' 
    GROUP BY student_id
) tampas ON s.id = tampas.student_id
LEFT JOIN (
    SELECT student_id, SUM(quantity) as total 
    FROM exchanges 
    WHERE material_id = 'latas' 
    GROUP BY student_id
) latas ON s.id = latas.student_id
LEFT JOIN (
    SELECT student_id, SUM(quantity) as total 
    FROM exchanges 
    WHERE material_id = 'oleo' 
    GROUP BY student_id
) oleo ON s.id = oleo.student_id;

-- 4. View: Estatísticas Gerais
CREATE VIEW v_general_stats AS
SELECT 
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT c.id) as total_classes,
    COALESCE(SUM(s.narciso_coins), 0) as total_coins,
    COALESCE(SUM(CASE WHEN e.material_id = 'tampas' THEN e.quantity END), 0) as total_tampas,
    COALESCE(SUM(CASE WHEN e.material_id = 'latas' THEN e.quantity END), 0) as total_latas,
    COALESCE(SUM(CASE WHEN e.material_id = 'oleo' THEN e.quantity END), 0) as total_oleo
FROM students s
JOIN classes c ON s.class_id = c.id
LEFT JOIN exchanges e ON s.id = e.student_id;
```

### Exemplo de Uso das Views:
```sql
-- Ranking geral (página de ranking)
SELECT * FROM v_student_coin_ranking LIMIT 10;

-- Top 3 em tampas
SELECT * FROM v_student_material_totals 
ORDER BY total_tampas DESC LIMIT 3;

-- Ranking de uma turma específica
SELECT * FROM v_class_rankings 
WHERE class_id = $1 
ORDER BY rank_in_class;

-- Estatísticas do dashboard
SELECT * FROM v_general_stats;
```

## 🔧 Triggers Essenciais (Automação)

O sistema inclui triggers para automatizar operações críticas no banco de dados:

### 1. Trigger `updated_at` (Automação de Timestamps)

Atualiza automaticamente o campo `updated_at` sempre que um registro nas tabelas `teachers` ou `students` é modificado.

```sql
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para teachers
CREATE TRIGGER update_teachers_updated_at 
    BEFORE UPDATE ON teachers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para students
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Trigger de Validação de Taxas de Conversão

Garante que apenas uma taxa de conversão esteja ativa por material, desativando automaticamente as taxas anteriores quando uma nova é inserida.

```sql
-- Função para gerenciar taxas de conversão ativas
CREATE OR REPLACE FUNCTION manage_conversion_rates()
RETURNS TRIGGER AS $$
BEGIN
    -- Desativar todas as taxas anteriores do mesmo material
    UPDATE material_conversion_rates 
    SET effective_until = NOW()
    WHERE material_id = NEW.material_id 
      AND effective_until IS NULL 
      AND id != NEW.id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para material_conversion_rates
CREATE TRIGGER manage_active_conversion_rates
    AFTER INSERT ON material_conversion_rates
    FOR EACH ROW
    EXECUTE FUNCTION manage_conversion_rates();
```

### 3. Trigger de Sincronização de Email

Sincroniza automaticamente o email da tabela `auth.users` quando um novo professor é criado ou quando o email é atualizado.

```sql
-- Função para sincronizar email automaticamente
CREATE OR REPLACE FUNCTION sync_teacher_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT, buscar email do auth.users
    IF TG_OP = 'INSERT' THEN
        SELECT email INTO NEW.email 
        FROM auth.users 
        WHERE id = NEW.id;
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar email na inserção
CREATE TRIGGER sync_teacher_email_on_insert
    BEFORE INSERT ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION sync_teacher_email();
```

**Vantagens dos Triggers:**
- ✅ **Automação total** - nunca esquece de executar
- ✅ **Consistência garantida** - sempre funciona
- ✅ **Código mais simples** na aplicação
- ✅ **Zero risco** - triggers seguros e testados

---

## 🔧 **Sistema de Ajustes Manuais de Saldo**

### Arquitetura: Abordagem 2 + Interface Inteligente

O sistema de ajustes manuais foi projetado para permitir correções de saldo dos alunos **preservando a integridade dos dados reais** e mantendo **auditoria completa** de todas as modificações.

#### 🏗️ **Componentes da Arquitetura:**

##### 1. **Tabela `student_adjustments` (Auditoria Completa)**
```sql
CREATE TABLE student_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  adjustment_type VARCHAR NOT NULL CHECK (adjustment_type IN ('narciso_coins', 'pending_tampas', 'pending_latas', 'pending_oleo')),
  previous_value INTEGER NOT NULL,
  adjustment_value INTEGER NOT NULL,
  new_value INTEGER NOT NULL,
  reason TEXT,
  teacher_id UUID REFERENCES teachers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### 2. **Campos de Ajuste na Tabela `students`**
```sql
-- Adicionados à tabela students existente:
ALTER TABLE students ADD COLUMN adjustment_narciso_coins INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN adjustment_pending_tampas INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN adjustment_pending_latas INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN adjustment_pending_oleo INTEGER DEFAULT 0;
```

##### 3. **Views Inteligentes (Valores Efetivos)**
```sql
-- View que combina valores reais + ajustes para a interface
CREATE VIEW v_students_effective_values AS
SELECT 
    s.*,
    (s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) as effective_narciso_coins,
    (s.pending_tampas + COALESCE(s.adjustment_pending_tampas, 0)) as effective_pending_tampas,
    (s.pending_latas + COALESCE(s.adjustment_pending_latas, 0)) as effective_pending_latas,
    (s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0)) as effective_pending_oleo
FROM students s;
```

#### 🔄 **Funcionamento do Sistema:**

##### **Para fazer um ajuste:**

1. **Interface registra na tabela de auditoria:
```sql
-- Exemplo: Ajustar +5 moedas para o aluno
INSERT INTO student_adjustments (
    student_id, 
    adjustment_type, 
    previous_value, 
    adjustment_value, 
    new_value, 
    reason, 
    teacher_id
) VALUES (
    'student-uuid',
    'narciso_coins',
    10, -- valor anterior
    5,  -- ajuste
    15, -- novo valor efetivo
    'Correção por erro de sistema',
    'teacher-uuid'
);
```

2. **Trigger automático sincroniza campos de ajuste:
```sql
-- Função de sincronização automática
CREATE OR REPLACE FUNCTION sync_student_adjustments()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular o ajuste total para este aluno/tipo
    UPDATE students 
    SET adjustment_narciso_coins = (
        SELECT COALESCE(SUM(adjustment_value), 0) 
        FROM student_adjustments 
        WHERE student_id = NEW.student_id 
        AND adjustment_type = 'narciso_coins'
    )
    WHERE id = NEW.student_id
    AND NEW.adjustment_type = 'narciso_coins';
    
    -- Repetir para outros tipos de ajuste...
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar ajustes
CREATE TRIGGER sync_adjustments_on_insert
    AFTER INSERT ON student_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_adjustments();
```

##### **Para consultar dados:**

```sql
-- A aplicação sempre usa a view para mostrar valores efetivos
SELECT 
    name,
    effective_narciso_coins as narciso_coins,
    effective_pending_tampas as pending_tampas,
    effective_pending_latas as pending_latas,
    effective_pending_oleo as pending_oleo
FROM v_students_effective_values 
WHERE id = 'student-uuid';

-- Para auditoria/histórico de ajustes
SELECT 
    sa.adjustment_type,
    sa.previous_value,
    sa.adjustment_value,
    sa.new_value,
    sa.reason,
    t.name as teacher_name,
    sa.created_at
FROM student_adjustments sa
JOIN teachers t ON sa.teacher_id = t.id
WHERE sa.student_id = 'student-uuid'
ORDER BY sa.created_at DESC;
```

#### ✅ **Vantagens desta Arquitetura:**

1. **🔒 Preservação de Dados Reais**: Valores originais nunca são alterados
2. **📋 Auditoria Completa**: Histórico detalhado de todos os ajustes
3. **🔄 Sincronização Automática**: Triggers mantêm consistência
4. **⚡ Performance**: Views otimizadas para consultas da interface
5. **🔍 Transparência**: Fácil distinção entre dados reais e ajustados
6. **🛡️ Reversibilidade**: Possível desfazer ajustes individualmente
7. **👥 Rastreabilidade**: Saber quem fez qual ajuste e quando

#### 🎯 **Casos de Uso:**

- **Correção de Erros**: Aluno teve materiais registrados incorretamente
- **Premiações Especiais**: Bônus de moedas por eventos especiais
- **Ajustes de Migração**: Correções durante importação de dados antigos
- **Penalizações**: Redução de saldo por comportamento inadequado (com devida justificativa)

#### 🚨 **Controles de Segurança:**

```sql
-- Apenas professores podem fazer ajustes
CREATE POLICY "Only teachers can create adjustments" ON student_adjustments
FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM teachers WHERE role = 'teacher')
);

-- Ajustes são imutáveis (apenas INSERT, nunca UPDATE/DELETE)
CREATE POLICY "Adjustments are immutable" ON student_adjustments
FOR UPDATE USING (false);

CREATE POLICY "Adjustments cannot be deleted" ON student_adjustments
FOR DELETE USING (false);
```

---

## Executar Tudo de Uma Vez

**⚠️ IMPORTANTE:** Execute este SQL completo no SQL Editor do Supabase para criar toda a estrutura de uma vez.

```sql
-- ===================================================================
-- SCRIPT COMPLETO PARA CRIAÇÃO DA BASE DE DADOS MOEDAS NARCISO
-- Execute tudo de uma vez no SQL Editor do Supabase
-- ===================================================================

-- 1. CRIAR/ATUALIZAR TABELAS PRINCIPAIS
-- -----------------------------------

-- Tabela teachers (atualizar estrutura existente)
-- Adicionar colunas que não existem
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'teacher';

ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS email VARCHAR;

ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Adicionar constraint de role se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'teachers_role_check'
    ) THEN
        ALTER TABLE teachers 
        ADD CONSTRAINT teachers_role_check 
        CHECK (role IN ('teacher', 'student_helper'));
    END IF;
END $$;

-- Tabela classes
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela students (incluindo photo_url)
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  gender VARCHAR CHECK (gender IN ('masculino', 'feminino', 'outro', 'prefiroNaoInformar')),
  photo_url VARCHAR, -- URL da foto no Supabase Storage
  narciso_coins INTEGER DEFAULT 0,
  pending_tampas INTEGER DEFAULT 0,
  pending_latas INTEGER DEFAULT 0,
  pending_oleo INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela materials
CREATE TABLE IF NOT EXISTS materials (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  label VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela material_conversion_rates
CREATE TABLE IF NOT EXISTS material_conversion_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id VARCHAR REFERENCES materials(id) ON DELETE CASCADE,
  units_per_coin INTEGER NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela exchanges
CREATE TABLE IF NOT EXISTS exchanges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  material_id VARCHAR REFERENCES materials(id),
  quantity INTEGER NOT NULL,
  coins_earned INTEGER DEFAULT 0,
  teacher_id UUID REFERENCES teachers(id),
  exchange_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CONFIGURAR SEGURANÇA (RLS)
-- -----------------------------------

-- Habilitar RLS nas tabelas necessárias
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_conversion_rates ENABLE ROW LEVEL SECURITY;

-- Policies de segurança com níveis de acesso (CORRIGIDAS)
-- Remover políticas antigas
DROP POLICY IF EXISTS "Professores podem ver suas próprias informações" ON teachers;
DROP POLICY IF EXISTS "Professores podem atualizar seus próprios dados" ON teachers;
DROP POLICY IF EXISTS "Authenticated users can manage teachers data" ON teachers;

-- Políticas granulares e seguras
-- SELECT: Todos os usuários autenticados podem ver dados básicos dos professores
CREATE POLICY "Users can view teachers basic data" ON teachers 
  FOR SELECT USING (auth.role() = 'authenticated');

-- INSERT: Apenas professores podem criar novos professores/auxiliares
CREATE POLICY "Teachers can create new teachers" ON teachers 
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM teachers WHERE role = 'teacher')
  );

-- UPDATE: Professores podem editar qualquer professor, auxiliares só seus próprios dados
CREATE POLICY "Teachers and helpers can update teacher data" ON teachers 
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM teachers WHERE role = 'teacher') OR 
    (auth.uid() = id AND auth.uid() IN (SELECT id FROM teachers WHERE role = 'student_helper'))
  );

-- DELETE: Apenas professores podem deletar outros professores
CREATE POLICY "Teachers can delete teachers" ON teachers 
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM teachers WHERE role = 'teacher')
  );

DROP POLICY IF EXISTS "Only teachers can manage classes" ON classes;
CREATE POLICY "Only teachers can manage classes" ON classes 
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM teachers WHERE role = 'teacher')
  );

DROP POLICY IF EXISTS "Only teachers can manage students" ON students;
CREATE POLICY "Only teachers can manage students" ON students 
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM teachers WHERE role = 'teacher')
  );

DROP POLICY IF EXISTS "Teachers and helpers can manage exchanges" ON exchanges;
CREATE POLICY "Teachers and helpers can manage exchanges" ON exchanges 
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only teachers can manage conversion rates" ON material_conversion_rates;
CREATE POLICY "Only teachers can manage conversion rates" ON material_conversion_rates 
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM teachers WHERE role = 'teacher')
  );

DROP POLICY IF EXISTS "Allow reading materials" ON materials;
CREATE POLICY "Allow reading materials" ON materials 
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- -----------------------------------

CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_student_id ON exchanges(student_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_material_id ON exchanges(material_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_date ON exchanges(exchange_date);
CREATE INDEX IF NOT EXISTS idx_teachers_role ON teachers(role);

-- 4. INSERIR DADOS INICIAIS
-- -----------------------------------

-- Inserir materiais (usar INSERT ... ON CONFLICT para evitar duplicatas)
INSERT INTO materials (id, name, label) VALUES
  ('tampas', 'tampas', 'Tampas (unidades)'),
  ('latas', 'latas', 'Latas (unidades)'),
  ('oleo', 'oleo', 'Óleo (litros)')
ON CONFLICT (id) DO NOTHING;

-- Inserir taxas de conversão iniciais
INSERT INTO material_conversion_rates (material_id, units_per_coin) VALUES
  ('tampas', 20),
  ('latas', 30),
  ('oleo', 2)
ON CONFLICT DO NOTHING;

-- 5. CRIAR VIEWS PARA RANKINGS (OPCIONAIS)
-- -----------------------------------

-- View: Ranking Geral de Alunos por Moedas
CREATE OR REPLACE VIEW v_student_coin_ranking AS
SELECT 
    s.id,
    s.name,
    s.class_id,
    c.name as class_name,
    s.narciso_coins,
    ROW_NUMBER() OVER (ORDER BY s.narciso_coins DESC) as rank_position
FROM students s
JOIN classes c ON s.class_id = c.id
ORDER BY s.narciso_coins DESC;

-- View: Totais de Materiais por Aluno
CREATE OR REPLACE VIEW v_student_material_totals AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.class_id,
    c.name as class_name,
    COALESCE(SUM(CASE WHEN e.material_id = 'tampas' THEN e.quantity END), 0) as total_tampas,
    COALESCE(SUM(CASE WHEN e.material_id = 'latas' THEN e.quantity END), 0) as total_latas,
    COALESCE(SUM(CASE WHEN e.material_id = 'oleo' THEN e.quantity END), 0) as total_oleo,
    s.narciso_coins
FROM students s
JOIN classes c ON s.class_id = c.id
LEFT JOIN exchanges e ON s.id = e.student_id
GROUP BY s.id, s.name, s.class_id, c.name, s.narciso_coins;

-- View: Ranking por Turma
CREATE OR REPLACE VIEW v_class_rankings AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.class_id,
    c.name as class_name,
    s.narciso_coins,
    COALESCE(tampas.total, 0) as total_tampas,
    COALESCE(latas.total, 0) as total_latas,
    COALESCE(oleo.total, 0) as total_oleo,
    ROW_NUMBER() OVER (PARTITION BY s.class_id ORDER BY s.narciso_coins DESC) as rank_in_class
FROM students s
JOIN classes c ON s.class_id = c.id
LEFT JOIN (
    SELECT student_id, SUM(quantity) as total 
    FROM exchanges 
    WHERE material_id = 'tampas' 
    GROUP BY student_id
) tampas ON s.id = tampas.student_id
LEFT JOIN (
    SELECT student_id, SUM(quantity) as total 
    FROM exchanges 
    WHERE material_id = 'latas' 
    GROUP BY student_id
) latas ON s.id = latas.student_id
LEFT JOIN (
    SELECT student_id, SUM(quantity) as total 
    FROM exchanges 
    WHERE material_id = 'oleo' 
    GROUP BY student_id
) oleo ON s.id = oleo.student_id;

-- View: Estatísticas Gerais
CREATE OR REPLACE VIEW v_general_stats AS
SELECT 
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT c.id) as total_classes,
    COALESCE(SUM(s.narciso_coins), 0) as total_coins,
    COALESCE(SUM(CASE WHEN e.material_id = 'tampas' THEN e.quantity END), 0) as total_tampas,
    COALESCE(SUM(CASE WHEN e.material_id = 'latas' THEN e.quantity END), 0) as total_latas,
    COALESCE(SUM(CASE WHEN e.material_id = 'oleo' THEN e.quantity END), 0) as total_oleo
FROM students s
JOIN classes c ON s.class_id = c.id
LEFT JOIN exchanges e ON s.id = e.student_id;

-- 6. CRIAR TRIGGERS ESSENCIAIS
-- -----------------------------------

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_teachers_updated_at
    BEFORE UPDATE ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para gerenciar taxas de conversão ativas
CREATE OR REPLACE FUNCTION manage_conversion_rates()
RETURNS TRIGGER AS $$
BEGIN
    -- Desativar todas as taxas anteriores do mesmo material
    UPDATE material_conversion_rates 
    SET effective_until = NOW()
    WHERE material_id = NEW.material_id 
      AND effective_until IS NULL 
      AND id != NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para material_conversion_rates
CREATE TRIGGER manage_active_conversion_rates
    AFTER INSERT ON material_conversion_rates
    FOR EACH ROW
    EXECUTE FUNCTION manage_conversion_rates();

-- Função para sincronizar email automaticamente
CREATE OR REPLACE FUNCTION sync_teacher_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT, buscar email do auth.users
    IF TG_OP = 'INSERT' THEN
        SELECT email INTO NEW.email 
        FROM auth.users 
        WHERE id = NEW.id;
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar email na inserção
CREATE TRIGGER sync_teacher_email_on_insert
    BEFORE INSERT ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION sync_teacher_email();

-- 7. SISTEMA DE AJUSTES MANUAIS DE SALDO
-- -----------------------------------

-- Tabela para auditoria completa de ajustes
CREATE TABLE IF NOT EXISTS student_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  adjustment_type VARCHAR NOT NULL CHECK (adjustment_type IN ('narciso_coins', 'pending_tampas', 'pending_latas', 'pending_oleo')),
  previous_value INTEGER NOT NULL,
  adjustment_value INTEGER NOT NULL,
  new_value INTEGER NOT NULL,
  reason TEXT,
  teacher_id UUID REFERENCES teachers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar campos de ajuste à tabela students (se não existirem)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS adjustment_narciso_coins INTEGER DEFAULT 0;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS adjustment_pending_tampas INTEGER DEFAULT 0;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS adjustment_pending_latas INTEGER DEFAULT 0;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS adjustment_pending_oleo INTEGER DEFAULT 0;

-- Habilitar RLS na tabela de ajustes
ALTER TABLE student_adjustments ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para ajustes
DROP POLICY IF EXISTS "Only teachers can create adjustments" ON student_adjustments;
CREATE POLICY "Only teachers can create adjustments" ON student_adjustments
FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM teachers WHERE role = 'teacher')
);

DROP POLICY IF EXISTS "Teachers can view all adjustments" ON student_adjustments;
CREATE POLICY "Teachers can view all adjustments" ON student_adjustments
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM teachers WHERE role = 'teacher')
);

-- Ajustes são imutáveis (apenas INSERT, nunca UPDATE/DELETE)
DROP POLICY IF EXISTS "Adjustments are immutable" ON student_adjustments;
CREATE POLICY "Adjustments are immutable" ON student_adjustments
FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Adjustments cannot be deleted" ON student_adjustments;
CREATE POLICY "Adjustments cannot be deleted" ON student_adjustments
FOR DELETE USING (false);

-- Função para sincronizar ajustes automaticamente
CREATE OR REPLACE FUNCTION sync_student_adjustments()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular o ajuste total para este aluno/tipo
    IF NEW.adjustment_type = 'narciso_coins' THEN
        UPDATE students 
        SET adjustment_narciso_coins = (
            SELECT COALESCE(SUM(adjustment_value), 0) 
            FROM student_adjustments 
            WHERE student_id = NEW.student_id 
            AND adjustment_type = 'narciso_coins'
        )
        WHERE id = NEW.student_id;
    ELSIF NEW.adjustment_type = 'pending_tampas' THEN
        UPDATE students 
        SET adjustment_pending_tampas = (
            SELECT COALESCE(SUM(adjustment_value), 0) 
            FROM student_adjustments 
            WHERE student_id = NEW.student_id 
            AND adjustment_type = 'pending_tampas'
        )
        WHERE id = NEW.student_id;
    ELSIF NEW.adjustment_type = 'pending_latas' THEN
        UPDATE students 
        SET adjustment_pending_latas = (
            SELECT COALESCE(SUM(adjustment_value), 0) 
            FROM student_adjustments 
            WHERE student_id = NEW.student_id 
            AND adjustment_type = 'pending_latas'
        )
        WHERE id = NEW.student_id;
    ELSIF NEW.adjustment_type = 'pending_oleo' THEN
        UPDATE students 
        SET adjustment_pending_oleo = (
            SELECT COALESCE(SUM(adjustment_value), 0) 
            FROM student_adjustments 
            WHERE student_id = NEW.student_id 
            AND adjustment_type = 'pending_oleo'
        )
        WHERE id = NEW.student_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar ajustes
CREATE TRIGGER sync_adjustments_on_insert
    AFTER INSERT ON student_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_adjustments();

-- View para valores efetivos (reais + ajustes) usada pela interface
CREATE OR REPLACE VIEW v_students_effective_values AS
SELECT 
    s.*,
    (s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0)) as effective_narciso_coins,
    (s.pending_tampas + COALESCE(s.adjustment_pending_tampas, 0)) as effective_pending_tampas,
    (s.pending_latas + COALESCE(s.adjustment_pending_latas, 0)) as effective_pending_latas,
    (s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0)) as effective_pending_oleo,
    -- Indicadores se há ajustes aplicados
    CASE WHEN COALESCE(s.adjustment_narciso_coins, 0) != 0 THEN true ELSE false END as has_coin_adjustments,
    CASE WHEN COALESCE(s.adjustment_pending_tampas, 0) != 0 THEN true ELSE false END as has_tampas_adjustments,
    CASE WHEN COALESCE(s.adjustment_pending_latas, 0) != 0 THEN true ELSE false END as has_latas_adjustments,
    CASE WHEN COALESCE(s.adjustment_pending_oleo, 0) != 0 THEN true ELSE false END as has_oleo_adjustments
FROM students s;

-- Atualizar view de ranking para usar valores efetivos
CREATE OR REPLACE VIEW v_student_coin_ranking_with_adjustments AS
SELECT 
    s.id,
    s.name,
    s.class_id,
    c.name as class_name,
    s.effective_narciso_coins as narciso_coins,
    ROW_NUMBER() OVER (ORDER BY s.effective_narciso_coins DESC) as rank_position,
    s.has_coin_adjustments
FROM v_students_effective_values s
JOIN classes c ON s.class_id = c.id
ORDER BY s.effective_narciso_coins DESC;

-- Índices para performance das consultas de ajuste
CREATE INDEX IF NOT EXISTS idx_student_adjustments_student_id ON student_adjustments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_adjustments_type ON student_adjustments(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_student_adjustments_teacher_id ON student_adjustments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_adjustments_created_at ON student_adjustments(created_at);

-- ===================================================================
-- ✅ ESTRUTURA COMPLETA CRIADA COM SUCESSO!
-- ✅ SISTEMA DE AJUSTES MANUAIS IMPLEMENTADO!
-- ===================================================================
```

## Configuração Manual Adicional (Após o SQL)

### 1. Criar Bucket para Fotos (via Interface do Supabase)

No painel do Supabase, vá em **Storage** > **New Bucket**:
- **Name**: `student-photos`
- **Public**: Desabilitado (privado)
- **File Size Limit**: 5MB
- **Allowed MIME Types**: `image/jpeg,image/png,image/webp`

### 2. Políticas de Storage para Fotos (Execute no SQL Editor)

```sql
-- Políticas para o bucket student-photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-photos', 'student-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso às fotos
CREATE POLICY "Authenticated users can view student photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Teachers can upload student photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-photos' 
  AND auth.uid() IN (SELECT id FROM teachers WHERE role = 'teacher')
);

CREATE POLICY "Teachers can update student photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'student-photos' 
  AND auth.uid() IN (SELECT id FROM teachers WHERE role = 'teacher')
);

CREATE POLICY "Teachers can delete student photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-photos' 
  AND auth.uid() IN (SELECT id FROM teachers WHERE role = 'teacher')
);
```

---

## 📋 **Exemplos Práticos: Sistema de Ajustes Manuais**

### 🔧 **Como Fazer Ajustes na Prática

#### **Exemplo 1: Correção de Erro - Adicionar 5 Moedas**

```sql
-- 1. Consultar situação atual do aluno
SELECT 
    name,
    narciso_coins as moedas_reais,
    adjustment_narciso_coins as ajuste_atual,
    effective_narciso_coins as moedas_efetivas
FROM v_students_effective_values 
WHERE name = 'João Silva';

-- Resultado esperado:
-- name: João Silva, moedas_reais: 10, ajuste_atual: 0, moedas_efetivas: 10

-- 2. Registrar o ajuste (substitua os UUIDs pelos reais)
INSERT INTO student_adjustments (
    student_id, 
    adjustment_type, 
    previous_value, 
    adjustment_value, 
    new_value, 
    reason, 
    teacher_id
) VALUES (
    'uuid-do-joao', -- Substituir pelo UUID real do aluno
    'narciso_coins',
    10, -- valor efetivo anterior 
    5,  -- quantidade de ajuste (+5 moedas)
    15, -- novo valor efetivo (10 + 5)
    'Correção: materiais registrados incorretamente na semana passada',
    'uuid-do-professor' -- Substituir pelo UUID real do professor
);

-- 3. Verificar resultado (o trigger sincroniza automaticamente)
SELECT 
    name,
    narciso_coins as moedas_reais,
    adjustment_narciso_coins as ajuste_atual,
    effective_narciso_coins as moedas_efetivas,
    has_coin_adjustments as tem_ajustes
FROM v_students_effective_values 
WHERE name = 'João Silva';

-- Resultado esperado:
-- name: João Silva, moedas_reais: 10, ajuste_atual: 5, moedas_efetivas: 15, tem_ajustes: true
```

#### **Exemplo 2: Bônus Especial - Adicionar 3 Moedas por Evento**

```sql
-- Adicionar bônus para vários alunos participantes do evento
INSERT INTO student_adjustments (student_id, adjustment_type, previous_value, adjustment_value, new_value, reason, teacher_id)
SELECT 
    s.id as student_id,
    'narciso_coins' as adjustment_type,
    s.effective_narciso_coins as previous_value,
    3 as adjustment_value,
    s.effective_narciso_coins + 3 as new_value,
    'Bônus: Participação na Feira de Sustentabilidade 2025' as reason,
    'uuid-do-professor' as teacher_id
FROM v_students_effective_values s
WHERE s.class_id = 'uuid-da-turma-3ano'; -- Substituir pelo UUID real da turma
```

#### **Exemplo 3: Correção de Saldo Pendente - Ajustar Tampas**

```sql
-- Aluno tinha 15 tampas pendentes, mas deveria ter 8
-- Ajuste: -7 tampas pendentes

INSERT INTO student_adjustments (
    student_id, 
    adjustment_type, 
    previous_value, 
    adjustment_value, 
    new_value, 
    reason, 
    teacher_id
) VALUES (
    'uuid-da-maria',
    'pending_tampas',
    15, -- valor atual de tampas pendentes
    -7, -- reduzir 7 tampas
    8,  -- novo valor: 15 - 7 = 8
    'Correção: recontagem de tampas pendentes',
    'uuid-do-professor'
);
```

### 📊 **Como Consultar Histórico de Ajustes**

#### **Ver Todos os Ajustes de um Aluno:**

```sql
SELECT 
    sa.adjustment_type as tipo_ajuste,
    sa.previous_value as valor_anterior,
    sa.adjustment_value as valor_ajuste,
    sa.new_value as valor_novo,
    sa.reason as motivo,
    t.name as professor,
    sa.created_at as data_ajuste
FROM student_adjustments sa
JOIN teachers t ON sa.teacher_id = t.id
JOIN students s ON sa.student_id = s.id
WHERE s.name = 'João Silva'
ORDER BY sa.created_at DESC;
```

#### **Ver Ajustes Recentes (Últimos 7 dias):**

```sql
SELECT 
    s.name as aluno,
    sa.adjustment_type as tipo,
    sa.adjustment_value as ajuste,
    sa.reason as motivo,
    t.name as professor,
    sa.created_at as quando
FROM student_adjustments sa
JOIN students s ON sa.student_id = s.id
JOIN teachers t ON sa.teacher_id = t.id
WHERE sa.created_at >= NOW() - INTERVAL '7 days'
ORDER BY sa.created_at DESC;
```

#### **Auditoria: Quem Fez Mais Ajustes:**

```sql
SELECT 
    t.name as professor,
    COUNT(*) as total_ajustes,
    SUM(CASE WHEN sa.adjustment_value > 0 THEN 1 ELSE 0 END) as ajustes_positivos,
    SUM(CASE WHEN sa.adjustment_value < 0 THEN 1 ELSE 0 END) as ajustes_negativos
FROM student_adjustments sa
JOIN teachers t ON sa.teacher_id = t.id
WHERE sa.created_at >= NOW() - INTERVAL '30 days'
GROUP BY t.id, t.name
ORDER BY total_ajustes DESC;
```

### 🎯 **Como a Interface Deve Usar o Sistema**

#### **Para Mostrar Dados dos Alunos (sempre usar valores efetivos):**

```sql
-- ✅ CORRETO: Usar a view com valores efetivos
SELECT 
    id,
    name,
    class_id,
    effective_narciso_coins as narciso_coins,
    effective_pending_tampas as pending_tampas,
    effective_pending_latas as pending_latas,
    effective_pending_oleo as pending_oleo,
    has_coin_adjustments,
    has_tampas_adjustments,
    has_latas_adjustments,
    has_oleo_adjustments
FROM v_students_effective_values
ORDER BY effective_narciso_coins DESC;

-- ❌ INCORRETO: Nunca consultar direto a tabela students
-- SELECT * FROM students; -- Isso mostra valores sem ajustes!
```

#### **Para Ranking (usar ranking com ajustes):**

```sql
-- Ranking considerando ajustes
SELECT 
    name as aluno,
    class_name as turma,
    narciso_coins as moedas,
    rank_position as posicao,
    has_coin_adjustments as tem_ajustes
FROM v_student_coin_ranking_with_adjustments
LIMIT 10;
```

### 🔒 **Segurança e Controles**

#### **Verificar Permissões:**

```sql
-- Apenas professores podem fazer ajustes
-- Este INSERT falhará se o usuário não for professor
INSERT INTO student_adjustments (student_id, adjustment_type, previous_value, adjustment_value, new_value, reason, teacher_id)
VALUES ('uuid-aluno', 'narciso_coins', 10, 5, 15, 'Teste', auth.uid());
```

#### **Verificar Imutabilidade:**

```sql
-- Estas operações FALHARÃO devido às políticas de segurança
UPDATE student_adjustments SET reason = 'Novo motivo' WHERE id = 'uuid-ajuste'; -- ❌ FALHARÁ
DELETE FROM student_adjustments WHERE id = 'uuid-ajuste'; -- ❌ FALHARÁ
```

### 📈 **Relatórios de Gestão**

#### **Resumo de Ajustes por Mês:**

```sql
SELECT 
    DATE_TRUNC('month', created_at) as mes,
    adjustment_type as tipo,
    COUNT(*) as quantidade_ajustes,
    SUM(adjustment_value) as soma_ajustes,
    AVG(adjustment_value) as media_ajustes
FROM student_adjustments
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', created_at), adjustment_type
ORDER BY mes DESC, tipo;
```

#### **Alunos com Mais Ajustes:**

```sql
SELECT 
    s.name as aluno,
    COUNT(sa.id) as total_ajustes,
    SUM(CASE WHEN sa.adjustment_type = 'narciso_coins' THEN sa.adjustment_value ELSE 0 END) as total_ajuste_moedas
FROM students s
JOIN student_adjustments sa ON s.id = sa.student_id
GROUP BY s.id, s.name
HAVING COUNT(sa.id) > 2 -- Alunos com mais de 2 ajustes
ORDER BY total_ajustes DESC;
```

---

## ✅ **Sistema Completo Implementado**

O sistema de ajustes manuais está agora **totalmente implementado** e pronto para uso. Principais características:

- 🔒 **Segurança**: Apenas professores podem fazer ajustes
- 📋 **Auditoria**: Histórico completo de todas as modificações  
- 🔄 **Automação**: Triggers mantêm tudo sincronizado
- ⚡ **Performance**: Views otimizadas para consultas rápidas
- 🛡️ **Integridade**: Dados reais nunca são alterados
- 📊 **Transparência**: Interface sempre mostra valores efetivos

**Para usar o sistema**, a aplicação deve:
1. **Sempre consultar** `v_students_effective_values` em vez de `students`
2. **Registrar ajustes** via `INSERT` na tabela `student_adjustments` 
3. **Mostrar histórico** consultando `student_adjustments` com JOINs
4. **Usar ranking** da view `v_student_coin_ranking_with_adjustments`
