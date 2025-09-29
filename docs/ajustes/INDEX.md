# Índice da Documentação - Ajustes e Diagnósticos

## 📖 Documentação Disponível

| Arquivo | Propósito | Quando Usar |
|---------|-----------|-------------|
| **README.md** | Guia completo e detalhado | Primeira leitura, consulta completa |
| **QUICK_REFERENCE.md** | Comandos essenciais e consultas SQL | Uso diário, referência rápida |
| **TEMPLATE_PROBLEMA.md** | Template para documentar problemas | Quando encontrar discrepâncias |
| **setup.sh** | Configuração inicial dos scripts | Primeira instalação ou nova máquina |

## 🛠️ Scripts Funcionais

| Script | Função | Input | Output |
|--------|--------|-------|--------|
| **compare_bash.sh** | Comparação completa planilha vs sistema | `atualizado.csv`, `sistema_atual.csv` | Relatório de diferenças |
| **diff_materiais.sh** | Foco apenas em materiais (ignora moedas) | Arquivos normalizados | Lista de alunos com diferenças |
| **compare_data.py** | Comparação via Python com BD direto | `atualizado.csv`, connection string | Relatório detalhado |

## 🚀 Fluxo de Trabalho Recomendado

### Para Verificação Rotineira
1. Exportar dados: `psql ... \copy ... TO 'sistema_atual.csv'`
2. Executar: `./compare_bash.sh` 
3. Se houver diferenças: `./diff_materiais.sh`

### Para Investigação Detalhada
1. Seguir fluxo de verificação rotineira
2. Consultar `QUICK_REFERENCE.md` para SQLs específicas
3. Documentar problema usando `TEMPLATE_PROBLEMA.md`
4. Aplicar correções necessárias
5. Verificar novamente para confirmar resolução

### Para Nova Instalação
1. Executar: `./setup.sh`
2. Configurar connection string
3. Testar com `./compare_bash.sh`

## 📁 Organização de Arquivos

```
/docs/ajustes/
├── README.md                 # Guia principal
├── QUICK_REFERENCE.md        # Referência rápida  
├── TEMPLATE_PROBLEMA.md      # Template de documentação
├── INDEX.md                  # Este arquivo
├── setup.sh                  # Script de configuração
├── compare_bash.sh          # Script principal de comparação
├── diff_materiais.sh        # Script focado em materiais
├── compare_data.py          # Script Python avançado
├── atualizado.csv           # Planilha atual (renovar sempre)
├── sistema_atual.csv        # Export do sistema (renovar sempre)
└── problemas/               # Pasta para histórico de problemas
    └── YYYY-MM-DD/          # Subpastas por data
        ├── relatorio.md     # Relatório do problema
        ├── planilha.csv     # Backup da planilha
        └── sistema.csv      # Backup do sistema
```

## 🎯 Casos de Uso Comuns

### "Suspeito que há diferenças"
→ `./compare_bash.sh`

### "Quero ver só problemas de materiais"  
→ `./diff_materiais.sh`

### "Preciso de SQLs específicas"
→ `cat QUICK_REFERENCE.md`

### "Encontrei um problema e quero documentar"
→ `cp TEMPLATE_PROBLEMA.md problemas/$(date +%Y-%m-%d)-problema.md`

### "Configurar tudo pela primeira vez"
→ `./setup.sh`

## 🆘 Suporte

### Problemas Técnicos
1. Verificar se executou `./setup.sh`
2. Confirmar permissões: `ls -la *.sh`
3. Testar connection string manualmente
4. Consultar seção troubleshooting no README.md

### Dúvidas de Processo
1. Consultar README.md seção "Interpretação dos Resultados"
2. Verificar exemplos práticos no README.md
3. Usar TEMPLATE_PROBLEMA.md para documentar casos novos

## 📊 Histórico de Versões

| Data | Versão | Alterações |
|------|--------|------------|
| 2025-09-29 | 1.0 | Versão inicial com scripts e documentação completa |

---

**Última atualização:** 29/09/2025
**Responsável pela manutenção:** Equipe do projeto Moedas Narciso