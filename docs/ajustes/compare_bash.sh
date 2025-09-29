#!/bin/bash

echo "=== COMPARAÇÃO DE DADOS ==="
echo ""

# Função para normalizar nomes (converter para maiúsculas e remover espaços extras)
normalize_name() {
    echo "$1" | tr '[:lower:]' '[:upper:]' | sed 's/[[:space:]]\+/ /g' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

# Cria arquivo temporário com dados do CSV normalizado
echo "Processando dados da planilha..."
tail -n +2 atualizado.csv | while IFS=',' read -r turma nome tampas latas oleo moedas pend_tampas pend_latas pend_oleo; do
    nome_norm=$(normalize_name "$nome")
    echo "$nome_norm,$tampas,$latas,$oleo,$moedas,$pend_tampas,$pend_latas,$pend_oleo"
done | sort > planilha_normalizada.csv

# Cria arquivo temporário com dados do sistema normalizado
echo "Processando dados do sistema..."
tail -n +2 sistema_atual.csv | while IFS=',' read -r nome tampas latas oleo moedas pend_tampas pend_latas pend_oleo; do
    nome_norm=$(normalize_name "$nome")
    echo "$nome_norm,$tampas,$latas,$oleo,$moedas,$pend_tampas,$pend_latas,$pend_oleo"
done | sort > sistema_normalizado.csv

echo ""
echo "TOTAIS GERAIS:"

# Calcula totais da planilha
planilha_tampas=$(awk -F',' '{sum += $2} END {print sum}' planilha_normalizada.csv)
planilha_latas=$(awk -F',' '{sum += $3} END {print sum}' planilha_normalizada.csv)
planilha_oleo=$(awk -F',' '{sum += $4} END {print sum}' planilha_normalizada.csv)
planilha_moedas=$(awk -F',' '{sum += $5} END {print sum}' planilha_normalizada.csv)

# Calcula totais do sistema
sistema_tampas=$(awk -F',' '{sum += $2} END {print sum}' sistema_normalizado.csv)
sistema_latas=$(awk -F',' '{sum += $3} END {print sum}' sistema_normalizado.csv)
sistema_oleo=$(awk -F',' '{sum += $4} END {print sum}' sistema_normalizado.csv)
sistema_moedas=$(awk -F',' '{sum += $5} END {print sum}' sistema_normalizado.csv)

echo "Tampas - Planilha: $planilha_tampas, Sistema: $sistema_tampas, Diferença: $((planilha_tampas - sistema_tampas))"
echo "Latas  - Planilha: $planilha_latas, Sistema: $sistema_latas, Diferença: $((planilha_latas - sistema_latas))"
echo "Óleo   - Planilha: $planilha_oleo, Sistema: $sistema_oleo, Diferença: $((planilha_oleo - sistema_oleo))"
echo "Moedas - Planilha: $planilha_moedas, Sistema: $sistema_moedas, Diferença: $((planilha_moedas - sistema_moedas))"
echo ""

echo "DIFERENÇAS POR ALUNO (apenas alunos com diferenças):"
echo "Nome | Tampas (Plan-Sist) | Latas (Plan-Sist) | Óleo (Plan-Sist) | Moedas (Plan-Sist)"
echo "-------------------------------------------------------------------------------------"

# Join dos arquivos para comparar
join -t',' -1 1 -2 1 planilha_normalizada.csv sistema_normalizado.csv | while IFS=',' read -r nome p_tampas p_latas p_oleo p_moedas p_pend_t p_pend_l p_pend_o s_tampas s_latas s_oleo s_moedas s_pend_t s_pend_l s_pend_o; do
    diff_tampas=$((p_tampas - s_tampas))
    diff_latas=$((p_latas - s_latas))
    diff_oleo=$((p_oleo - s_oleo))
    diff_moedas=$((p_moedas - s_moedas))
    
    # Só mostra se há diferença
    if [ $diff_tampas -ne 0 ] || [ $diff_latas -ne 0 ] || [ $diff_oleo -ne 0 ] || [ $diff_moedas -ne 0 ]; then
        printf "%-45s | %8d | %8d | %8d | %8d\n" "$nome" "$diff_tampas" "$diff_latas" "$diff_oleo" "$diff_moedas"
    fi
done

echo ""
echo "ALUNOS APENAS NA PLANILHA:"
comm -23 <(cut -d',' -f1 planilha_normalizada.csv) <(cut -d',' -f1 sistema_normalizado.csv) | while read nome; do
    echo "  - $nome"
done

echo ""
echo "ALUNOS APENAS NO SISTEMA:"
comm -13 <(cut -d',' -f1 planilha_normalizada.csv) <(cut -d',' -f1 sistema_normalizado.csv) | while read nome; do
    echo "  - $nome"
done

# Limpa arquivos temporários
rm -f planilha_normalizada.csv sistema_normalizado.csv

echo ""
echo "Comparação concluída."