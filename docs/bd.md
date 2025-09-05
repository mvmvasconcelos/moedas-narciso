# Documentação do Banco de Dados - Projeto Narciso Coins

Este documento descreve a estrutura, regras de negócio e políticas de segurança do banco de dados do projeto "Narciso Coins". Ele serve como referência para o desenvolvimento de novas funcionalidades e para a manutenção do sistema.

## 1. Visão Geral da Arquitetura

O sistema utiliza um banco de dados PostgreSQL gerenciado pelo Supabase. A lógica da aplicação está contida principalmente no schema `public`, enquanto o armazenamento de arquivos (fotos dos alunos) é gerenciado pelo schema `storage`.

### Core Concepts
- **Alunos (`students`):** A entidade central. Cada aluno pertence a uma turma e possui saldos de materiais e moedas.
- **Turmas (`classes`):** Agrupam os alunos e são gerenciadas por professores.
- **Professores (`teachers`):** Usuários com permissões elevadas para gerenciar o sistema.
- **Trocas (`exchanges`):** O ato de um aluno entregar materiais recicláveis (`tampas`, `latas`, `oleo`) e receber `narciso_coins` em troca.
- **Ajustes (`student_adjustments`):** Correções manuais nos saldos dos alunos, feitas por professores, com rastreabilidade total.

### Schemas Relevantes
- **`public`**: Contém as tabelas, views e a lógica de negócio da aplicação. **Este é o schema principal para desenvolvimento.**
- **`storage`**: Gerencia os arquivos. No nosso caso, o bucket `student-photos`.
- **`auth`**: Schema interno do Supabase para gerenciamento de usuários. Usado pelas nossas políticas de segurança, mas não deve ser modificado diretamente.

---

## 2. Schema `public` (Lógica da Aplicação)

### 2.1. Tabelas (Modelo de Dados)

#### Tabela: `students`
- **Propósito:** Armazena os dados cadastrais e os saldos de cada aluno. É a tabela mais importante do sistema.
- **Colunas Notáveis:**
  - `narciso_coins`, `pending_tampas`, `pending_latas`, `pending_oleo`: Saldos "base" do aluno.
  - `adjustment_*`: Colunas que somam todos os ajustes manuais feitos. Isso separa o saldo original dos ajustes.
  - `total_*_exchanged`: Colunas que totalizam o histórico de trocas, servindo como um cache para relatórios.

<details>
<summary>Definição SQL da Tabela <code>students</code></summary>

```sql
CREATE TABLE public.students (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying NOT NULL,
    class_id uuid NULL,
    gender character varying NULL,
    photo_url character varying NULL,
    narciso_coins integer NULL DEFAULT 0,
    pending_tampas integer NULL DEFAULT 0,
    pending_latas integer NULL DEFAULT 0,
    pending_oleo integer NULL DEFAULT 0,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    total_tampas_exchanged integer NULL DEFAULT 0,
    total_latas_exchanged integer NULL DEFAULT 0,
    total_oleo_exchanged integer NULL DEFAULT 0,
    total_coins_earned integer NULL DEFAULT 0,
    adjustment_narciso_coins integer NULL DEFAULT 0,
    adjustment_pending_tampas integer NULL DEFAULT 0,
    adjustment_pending_latas integer NULL DEFAULT 0,
    adjustment_pending_oleo integer NULL DEFAULT 0
);
```
</details>

---

#### Tabela: `classes`
- **Propósito:** Define as turmas da escola.

<details>
<summary>Definição SQL da Tabela <code>classes</code></summary>

```sql
CREATE TABLE public.classes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying NOT NULL,
    teacher_id uuid NULL,
    created_at timestamp with time zone NULL DEFAULT now()
);
```
</details>

---

#### Tabela: `teachers`
- **Propósito:** Armazena os dados dos professores e seus papéis. Sincroniza com a tabela `auth.users` do Supabase.

<details>
<summary>Definição SQL da Tabela <code>teachers</code></summary>

```sql
CREATE TABLE public.teachers (
    id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    role character varying NULL DEFAULT 'teacher'::character varying,
    email character varying NULL,
    updated_at timestamp with time zone NULL DEFAULT now()
);
```
</details>

---

#### Tabela: `exchanges`
- **Propósito:** Registra cada transação de troca de material por moedas. É o histórico de "entradas" do sistema.

<details>
<summary>Definição SQL da Tabela <code>exchanges</code></summary>

```sql
CREATE TABLE public.exchanges (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NULL,
    material_id character varying NULL,
    quantity integer NOT NULL,
    coins_earned integer NULL DEFAULT 0,
    teacher_id uuid NULL,
    exchange_date timestamp with time zone NULL DEFAULT now(),
    created_at timestamp with time zone NULL DEFAULT now()
);
```
</details>

---

#### Tabela: `student_adjustments`
- **Propósito:** Tabela de auditoria para registrar ajustes manuais nos saldos dos alunos, garantindo rastreabilidade.

<details>
<summary>Definição SQL da Tabela <code>student_adjustments</code></summary>

```sql
CREATE TABLE public.student_adjustments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NULL,
    adjustment_type character varying NOT NULL,
    previous_value integer NOT NULL,
    adjustment_value integer NOT NULL,
    new_value integer NOT NULL,
    reason text NULL,
    teacher_id uuid NULL,
    created_at timestamp with time zone NULL DEFAULT now()
);
```
</details>

---

#### Tabela: `materials`
- **Propósito:** Tabela de lookup para os tipos de materiais recicláveis aceitos.

<details>
<summary>Definição SQL da Tabela <code>materials</code></summary>

```sql
CREATE TABLE public.materials (
    id character varying NOT NULL,
    name character varying NOT NULL,
    label character varying NOT NULL,
    created_at timestamp with time zone NULL DEFAULT now()
);
```
</details>

---

#### Tabela: `material_conversion_rates`
- **Propósito:** Define as regras de conversão (quantos itens valem 1 moeda), com data de início e fim de validade.

<details>
<summary>Definição SQL da Tabela <code>material_conversion_rates</code></summary>

```sql
CREATE TABLE public.material_conversion_rates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    material_id character varying NULL,
    units_per_coin integer NOT NULL,
    effective_from timestamp with time zone NOT NULL DEFAULT now(),
    effective_until timestamp with time zone NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    created_by uuid NULL
);
```
</details>

---

### 2.2. Views (Relatórios e Dados Consolidados)

As views são usadas para simplificar consultas complexas e fornecer dados pré-processados para a aplicação.

#### View: `v_students_effective_values`
- **Propósito:** View fundamental que calcula os saldos "efetivos" de cada aluno, somando o valor base com os ajustes (`base + adjustment`). É a fonte da verdade para a maioria dos outros relatórios.

<details>
<summary>Definição SQL da View <code>v_students_effective_values</code></summary>

```sql
CREATE OR REPLACE VIEW public.v_students_effective_values WITH (security_invoker=on) AS
SELECT s.id,
    s.name,
    s.class_id,
    s.gender,
    s.photo_url,
    s.narciso_coins,
    s.pending_tampas,
    s.pending_latas,
    s.pending_oleo,
    s.created_at,
    s.updated_at,
    s.total_tampas_exchanged,
    s.total_latas_exchanged,
    s.total_oleo_exchanged,
    s.total_coins_earned,
    s.adjustment_narciso_coins,
    s.adjustment_pending_tampas,
    s.adjustment_pending_latas,
    s.adjustment_pending_oleo,
    s.narciso_coins + COALESCE(s.adjustment_narciso_coins, 0) AS effective_narciso_coins,
    s.pending_tampas + COALESCE(s.adjustment_pending_tampas, 0) AS effective_pending_tampas,
    s.pending_latas + COALESCE(s.adjustment_pending_latas, 0) AS effective_pending_latas,
    s.pending_oleo + COALESCE(s.adjustment_pending_oleo, 0) AS effective_pending_oleo,
    CASE WHEN COALESCE(s.adjustment_narciso_coins, 0) <> 0 THEN true ELSE false END AS has_coin_adjustments,
    CASE WHEN COALESCE(s.adjustment_pending_tampas, 0) <> 0 THEN true ELSE false END AS has_tampas_adjustments,
    CASE WHEN COALESCE(s.adjustment_pending_latas, 0) <> 0 THEN true ELSE false END AS has_latas_adjustments,
    CASE WHEN COALESCE(s.adjustment_pending_oleo, 0) <> 0 THEN true ELSE false END AS has_oleo_adjustments
FROM students s;
```
</details>

#### View: `v_student_list`
- **Propósito:** A principal view para listar todos os alunos com seus saldos efetivos e totais trocados, pronta para ser consumida pelo frontend.

<details>
<summary>Definição SQL da View <code>v_student_list</code></summary>

```sql
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
```
</details>

#### Outras Views
- **`v_general_stats`**: Para dashboards, mostra os totais gerais de moedas e materiais trocados em todo o projeto.
- **`v_exchange_history`**: Fornece um log detalhado de todas as trocas, incluindo nomes de alunos e professores.
- **`v_student_coin_ranking_with_adjustments`**: Gera um ranking geral de alunos baseado no saldo efetivo de moedas.
- **`v_class_rankings`**: Gera um ranking de alunos *dentro de cada turma*.

---

### 2.3. Funções e Triggers (Automação e Lógica)

O sistema usa triggers para automatizar tarefas e garantir a consistência dos dados.

#### Trigger: `update_student_totals_on_exchange`
- **Evento:** `AFTER INSERT` na tabela `exchanges`.
- **Ação:** Chama a função `update_student_totals()`, que recalcula os totais de materiais e moedas na tabela `students` para o aluno envolvido na troca. Isso mantém os totais de `students` sempre sincronizados com o histórico de `exchanges`.

#### Trigger: `sync_adjustments_on_insert`
- **Evento:** `AFTER INSERT` na tabela `student_adjustments`.
- **Ação:** Chama a função `sync_student_adjustments()`, que atualiza o campo de ajuste correspondente (`adjustment_narciso_coins`, `adjustment_pending_tampas`, etc.) na tabela `students`.

#### Trigger: `manage_active_conversion_rates`
- **Evento:** `AFTER INSERT` na tabela `material_conversion_rates`.
- **Ação:** Chama a função `manage_conversion_rates()`, que automaticamente define uma data final (`effective_until`) para a taxa de conversão antiga do mesmo material, garantindo que apenas uma taxa esteja ativa por vez.

#### Trigger: `update_students_updated_at` / `update_teachers_updated_at`
- **Evento:** `BEFORE UPDATE` nas tabelas `students` e `teachers`.
- **Ação:** Chama a função `update_updated_at_column()` para atualizar automaticamente o campo `updated_at` para a data e hora atuais.

---

## 3. Regras de Acesso (Row Level Security - RLS)

A segurança é implementada via RLS, garantindo que os usuários só possam ver e modificar os dados que lhes são permitidos.

### Resumo das Políticas:
- **Professores (`role = 'teacher'`):**
  - Têm controle total (CRUD) sobre `students`, `classes`, `student_adjustments` e `material_conversion_rates`.
  - Podem criar, atualizar e deletar outros `teachers`.
  - Podem fazer upload, atualizar e deletar fotos de alunos no bucket `student-photos`.
- **Ajudantes (`role = 'student_helper'`):**
  - Podem gerenciar trocas (`exchanges`).
  - Podem atualizar seus próprios dados na tabela `teachers`.
- **Todos os Usuários Autenticados:**
  - Podem visualizar dados básicos de `teachers` e `materials`.
  - Podem visualizar as fotos dos alunos no bucket `student-photos`.
- **Imutabilidade:**
  - Registros na tabela `student_adjustments` não podem ser alterados ou deletados após a criação, garantindo a integridade da auditoria.

---

## 4. Schema `storage` (Armazenamento de Arquivos)

- **Propósito:** Armazenar arquivos de forma segura.
- **Bucket Utilizado:** `student-photos`
- **Políticas de Acesso:**
  - **Leitura:** Qualquer usuário autenticado pode ver as fotos.
  - **Escrita (Upload/Update/Delete):** Apenas usuários com o papel de `teacher` podem gerenciar as fotos.