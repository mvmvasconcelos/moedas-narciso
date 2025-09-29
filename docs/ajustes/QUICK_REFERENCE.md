# Referência Rápida - Comandos Essenciais

## 🚀 Diagnóstico Rápido (3 comandos)

```bash
# 1. Exportar dados do sistema
cd /docs/ajustes
PGOPTIONS='--statement-timeout=15000' psql "SUA_CONNECTION_STRING" -P pager=off -c "\copy (SELECT name, total_tampas_exchanged, total_latas_exchanged, total_oleo_exchanged, narciso_coins, pending_tampas, pending_latas, pending_oleo FROM students ORDER BY name) TO 'sistema_atual.csv' WITH CSV HEADER"

# 2. Comparar planilha vs sistema  
./compare_bash.sh

# 3. Ver apenas diferenças de materiais
./diff_materiais.sh
```

## 📊 Consultas SQL Úteis

### Totais Atuais do Sistema
```sql
SELECT 
  SUM(total_tampas_exchanged) as total_tampas,
  SUM(total_latas_exchanged) as total_latas,
  SUM(total_oleo_exchanged) as total_oleo,
  SUM(narciso_coins) as total_moedas
FROM students;
```

### Últimas 20 Trocas
```sql
SELECT 
  e.created_at,
  s.name,
  e.material_id,
  e.quantity,
  e.coins_earned
FROM exchanges e
JOIN students s ON e.student_id = s.id
ORDER BY e.created_at DESC
LIMIT 20;
```

### Trocas de Uma Data Específica
```sql
SELECT 
  s.name,
  e.material_id,
  e.quantity,
  e.coins_earned,
  e.created_at::date as data
FROM exchanges e
JOIN students s ON e.student_id = s.id
WHERE e.created_at::date = '2025-09-26'
ORDER BY e.created_at, s.name;
```

### Verificar Saldo Líquido (com vendas)
```sql
SELECT 
  s.name,
  COALESCE(exch.total_ganho, 0) - COALESCE(sales.total_gasto, 0) as saldo_calculado,
  s.narciso_coins as saldo_sistema,
  COALESCE(exch.total_ganho, 0) - COALESCE(sales.total_gasto, 0) - s.narciso_coins as diferenca
FROM students s
LEFT JOIN (
  SELECT student_id, SUM(coins_earned) as total_ganho 
  FROM exchanges GROUP BY student_id
) exch ON s.id = exch.student_id
LEFT JOIN (
  SELECT student_id, SUM(coins_spent) as total_gasto 
  FROM sales GROUP BY student_id  
) sales ON s.id = sales.student_id
WHERE COALESCE(exch.total_ganho, 0) - COALESCE(sales.total_gasto, 0) != s.narciso_coins
ORDER BY diferenca DESC;
```

## 🎯 Ações por Tipo de Problema

### Planilha tem mais que Sistema
**Causa:** Trocas não registradas no sistema
**Solução:** Registrar as trocas via interface web

### Sistema tem mais que Planilha  
**Causa:** Trocas não anotadas na planilha
**Solução:** Atualizar planilha ou verificar se registro no sistema está correto

### Diferenças só em Moedas
**Causa:** Vendas ou ajustes manuais
**Solução:** Verificar tabela `sales` e ajustes

## 🔧 Troubleshooting

### Terminal Trava
- Usar `PGOPTIONS='--statement-timeout=10000'`
- Adicionar `-P pager=off` nos comandos psql
- Pressionar `q` se aparecer pager

### Arquivos não Encontrados
```bash
# Verificar localização atual
pwd
ls -la

# Ir para pasta correta  
cd /docs/ajustes
```

### Scripts não Executam
```bash
chmod +x *.sh
```

## 📋 Checklist de Verificação

- [ ] Planilha atualizada salva como `atualizado.csv`
- [ ] Connection string do banco funcionando
- [ ] Scripts com permissão de execução
- [ ] Timeout configurado para evitar travamento
- [ ] Backup dos dados antes de grandes alterações