# Template de Relatório de Problema

**Data do Problema:** ___________
**Responsável:** _______________

## 📋 Descrição do Problema

**Sintomas observados:**
- [ ] Totais não batem entre planilha e sistema
- [ ] Trocas registradas na planilha não aparecem no sistema  
- [ ] Trocas aparecem no sistema mas não na planilha
- [ ] Moedas calculadas incorretamente
- [ ] Outro: _________________________________

**Diferenças encontradas:**
- Tampas: _______ (planilha) vs _______ (sistema) = _______ diferença
- Latas: _______ (planilha) vs _______ (sistema) = _______ diferença  
- Óleo: _______ (planilha) vs _______ (sistema) = _______ diferença
- Moedas: _______ (planilha) vs _______ (sistema) = _______ diferença

## 🔍 Diagnóstico Executado

**Comandos executados:**
- [ ] `./compare_bash.sh`
- [ ] `./diff_materiais.sh`
- [ ] `compare_data.py`
- [ ] Consulta SQL de últimas trocas
- [ ] Verificação de vendas
- [ ] Outro: _________________________________

**Alunos afetados:**
```
1. Nome: _________________ | Turma: _________ | Diferença: _________
2. Nome: _________________ | Turma: _________ | Diferença: _________
3. Nome: _________________ | Turma: _________ | Diferença: _________
[adicionar mais linhas se necessário]
```

**Período das discrepâncias:**
- Data inicial: ___________
- Data final: ___________
- Última troca correta: ___________

## 🛠️ Ação Tomada

**Solução aplicada:**
- [ ] Registrou trocas faltantes no sistema
- [ ] Atualizou planilha com dados do sistema
- [ ] Corrigiu registros incorretos
- [ ] Executou script de correção
- [ ] Outro: _________________________________

**Detalhes da correção:**
```
[Descrever exatamente o que foi feito]
```

**Comandos executados para correção:**
```bash
[Colar os comandos exatos utilizados]
```

## ✅ Verificação Pós-Correção

**Totais após correção:**
- Tampas: _______ (planilha) vs _______ (sistema) ✅ Igual
- Latas: _______ (planilha) vs _______ (sistema) ✅ Igual
- Óleo: _______ (planilha) vs _______ (sistema) ✅ Igual  
- Moedas: _______ (planilha) vs _______ (sistema) ✅ Igual

**Comandos de verificação executados:**
- [ ] `./compare_bash.sh` - resultado: OK
- [ ] Consulta totais SQL - resultado: OK
- [ ] Teste de algumas trocas individuais - resultado: OK

## 📝 Lições Aprendidas

**Causa raiz identificada:**
_________________________________________________

**Como prevenir no futuro:**
- [ ] Verificação dupla após cada sessão de registros
- [ ] Execução periódica dos scripts de diagnóstico
- [ ] Melhorias no processo de registro
- [ ] Outro: _________________________________

**Melhorias sugeridas:**
_________________________________________________

## 📎 Arquivos Relacionados

- [ ] `atualizado.csv` (planilha na data do problema)
- [ ] `sistema_atual.csv` (export do sistema na data)
- [ ] Screenshots dos erros (se houver)
- [ ] Logs de comandos executados
- [ ] Backup pré-correção

**Localização dos arquivos:** `/docs/ajustes/problemas/YYYY-MM-DD/`

---

**Status:** [ ] Em andamento [ ] Resolvido [ ] Precisa acompanhamento

**Próxima verificação agendada:** ___________