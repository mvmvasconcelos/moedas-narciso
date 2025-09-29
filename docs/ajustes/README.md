# Guia de Diagnóstico e Correção de Discrepâncias

Este documento explica como usar os scripts de diagnóstico para identificar e corrigir discrepâncias entre a planilha de controle e o sistema de moedas Narciso.

## 📋 Contexto

Durante o uso do sistema, podem ocorrer situações onde:
- Trocas são registradas na planilha mas falham no sistema (problemas técnicos)
- Dados ficam dessincronizados entre planilha e banco de dados
- É necessário verificar a consistência dos totais

## 🛠️ Scripts Disponíveis

### 1. `compare_bash.sh`
**Propósito:** Compara dados da planilha com dados do sistema

**Como usar:**
```bash
cd /docs/ajustes
./compare_bash.sh
```

**Pré-requisitos:**
- Arquivo `atualizado.csv` (planilha atual)
- Arquivo `sistema_atual.csv` (exportado do sistema)

**O que faz:**
- Normaliza nomes de alunos
- Compara totais gerais
- Lista diferenças por aluno
- Identifica alunos apenas em um dos sistemas

### 2. `diff_materiais.sh`
**Propósito:** Foca apenas nas diferenças de materiais (tampas, latas, óleo), ignorando moedas

**Como usar:**
```bash
cd /docs/ajustes
./diff_materiais.sh
```

**Saída:**
- Lista apenas alunos com diferenças nos materiais
- Mostra diferenças específicas por tipo de material
- Ignora discrepâncias de moedas (que podem ser calculadas)

### 3. `compare_data.py`
**Propósito:** Comparação avançada usando Python (requer psycopg2)

**Instalação:**
```bash
pip install psycopg2-binary
```

**Como usar:**
```bash
cd /docs/ajustes
python3 compare_data.py
```

**Funcionalidades:**
- Conexão direta com banco de dados
- Normalização automática de nomes
- Relatórios detalhados de diferenças

## 📊 Processo de Diagnóstico

### Passo 1: Exportar Dados do Sistema
```bash
cd /docs/ajustes
PGOPTIONS='--statement-timeout=15000' psql "CONNECTION_STRING" -P pager=off -c "\copy (SELECT name, total_tampas_exchanged, total_latas_exchanged, total_oleo_exchanged, narciso_coins, pending_tampas, pending_latas, pending_oleo FROM students ORDER BY name) TO 'sistema_atual.csv' WITH CSV HEADER"
```

### Passo 2: Executar Comparação
```bash
./compare_bash.sh
```

### Passo 3: Identificar Diferenças nos Materiais
```bash
./diff_materiais.sh
```

### Passo 4: Verificar Registros Recentes
Para identificar quando foram feitas as últimas alterações:
```sql
SELECT 
  e.created_at,
  s.name,
  e.material_id,
  e.quantity,
  e.coins_earned
FROM exchanges e
JOIN students s ON e.student_id = s.id
WHERE e.created_at > 'DATA_LIMITE'
ORDER BY e.created_at DESC;
```

## 🔍 Interpretação dos Resultados

### Diferenças Positivas (Planilha > Sistema)
**Significado:** Material registrado na planilha mas não no sistema
**Ação:** Registrar essas trocas no sistema via interface web

### Diferenças Negativas (Sistema > Planilha)
**Significado:** Material registrado no sistema mas não na planilha  
**Ação:** Atualizar planilha ou verificar se o registro no sistema está correto

### Diferenças Apenas em Moedas
**Possível Causa:** 
- Vendas registradas (moedas gastas)
- Ajustes manuais de saldo
- Diferenças nas taxas de conversão

**Verificação:**
```sql
-- Verificar vendas
SELECT student_id, SUM(coins_spent) 
FROM sales 
GROUP BY student_id;

-- Verificar saldo líquido
SELECT 
  s.name,
  COALESCE(exch.coins_earned, 0) - COALESCE(sales.coins_spent, 0) AS saldo_calculado,
  s.narciso_coins AS saldo_sistema
FROM students s
LEFT JOIN (SELECT student_id, SUM(coins_earned) as coins_earned FROM exchanges GROUP BY student_id) exch ON s.id = exch.student_id  
LEFT JOIN (SELECT student_id, SUM(coins_spent) as coins_spent FROM sales GROUP BY student_id) sales ON s.id = sales.student_id;
```

## 📝 Exemplo Prático: Caso 26/09/2025

**Situação:** Trocas registradas na planilha não apareceram no sistema

**Diagnóstico:**
1. Executamos `compare_bash.sh`
2. Identificamos 9 alunos com diferenças nos materiais
3. Verificamos que nenhum desses alunos teve registros no sistema na data
4. Confirmamos que as trocas estavam apenas na planilha

**Resultado:**
- 871 tampas, 162 latas, 15L óleo precisavam ser registrados
- Organizamos por turma para facilitar localização na planilha
- Identificamos que o problema foi técnico durante o registro

## 🚨 Prevenção

### Checklist Pós-Registro
1. ✅ Verificar se os totais do sistema aumentaram após registro
2. ✅ Comparar últimos registros com anotações da planilha
3. ✅ Executar verificação rápida se houver suspeita de problema

### Verificação Rápida
```bash
# Totais atuais do sistema
psql "CONNECTION_STRING" -c "SELECT SUM(total_tampas_exchanged), SUM(total_latas_exchanged), SUM(total_oleo_exchanged) FROM students;"

# Últimos registros
psql "CONNECTION_STRING" -c "SELECT s.name, e.material_id, e.quantity, e.created_at FROM exchanges e JOIN students s ON e.student_id = s.id ORDER BY e.created_at DESC LIMIT 10;"
```

## 📁 Estrutura de Arquivos

```
/docs/ajustes/
├── README.md (este arquivo)
├── compare_bash.sh (comparação via shell)
├── diff_materiais.sh (foco em materiais)  
├── compare_data.py (comparação via Python)
├── atualizado.csv (planilha atual - atualizar conforme necessário)
├── sistema_atual.csv (export do sistema - regenerar quando necessário)
└── [arquivos temporários de comparação]
```

## 🔧 Solução de Problemas

### Erro "psycopg2 not found"
```bash
pip install psycopg2-binary
```

### Erro "Permission denied"
```bash
chmod +x *.sh
```

### Connection string não funciona
- Verificar se a string está entre aspas
- Confirmar timeout adequado (`PGOPTIONS='--statement-timeout=15000'`)
- Usar `-P pager=off` para evitar travamento do terminal

### Nomes não fazem match
- Os scripts normalizam automaticamente (maiúsculas, espaços)
- Verificar se há caracteres especiais ou acentos diferentes
- Conferir se o nome está exatamente igual na planilha e sistema

## 📞 Contato

Para dúvidas sobre os scripts ou melhorias, consultar a documentação técnica ou revisar o histórico de commits relacionados aos ajustes de sincronização.