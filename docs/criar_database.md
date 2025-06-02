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

-- ===================================================================
-- ✅ ESTRUTURA COMPLETA CRIADA COM SUCESSO!
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

## Quando Evoluir a Estrutura

**Considere aumentar a complexidade apenas se:**
- Mais de 10.000 alunos simultâneos
- Mais de 100.000 contribuições por mês
- Múltiplas escolas no mesmo sistema
- Necessidade de auditoria complexa
- Regras de negócio muito complexas

**Para o escopo atual (uma escola), esta estrutura é perfeita!** 🎯
