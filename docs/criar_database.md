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

-- View: Lista Completa de Alunos
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
    (s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0)) as pending_oleo
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

-- View: Lista Completa de Alunos
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
    (s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0)) as pending_oleo
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

-- View: Lista Completa de Alunos
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
    (s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0)) as pending_oleo
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

-- View: Lista Completa de Alunos
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
    (s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0)) as pending_oleo
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

-- View: Lista Completa de Alunos
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
    (s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0)) as pending_oleo
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
   