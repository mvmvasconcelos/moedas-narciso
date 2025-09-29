#!/bin/bash

echo "=== ALUNOS COM DIFERENÇAS NAS QUANTIDADES DE MATERIAIS ==="
echo ""
echo "Comparando apenas: Tampas, Latas e Óleo"
echo "Formato: Nome | Diff Tampas | Diff Latas | Diff Óleo"
echo "(Diferença = Planilha - Sistema)"
echo ""
echo "--------------------------------------------------------------------"

# Join dos arquivos para comparar apenas materiais
join -t',' -1 1 -2 1 <(sort planilha_normalizada.csv 2>/dev/null || echo "") <(sort sistema_normalizado.csv 2>/dev/null || echo "") | while IFS=',' read -r nome p_tampas p_latas p_oleo p_moedas p_pend_t p_pend_l p_pend_o s_tampas s_latas s_oleo s_moedas s_pend_t s_pend_l s_pend_o; do
    diff_tampas=$((p_tampas - s_tampas))
    diff_latas=$((p_latas - s_latas))
    diff_oleo=$((p_oleo - s_oleo))
    
    # Só mostra se há diferença em materiais (ignora moedas)
    if [ $diff_tampas -ne 0 ] || [ $diff_latas -ne 0 ] || [ $diff_oleo -ne 0 ]; then
        printf "%-45s | %8d | %8d | %8d\n" "$nome" "$diff_tampas" "$diff_latas" "$diff_oleo"
    fi
done

echo ""
echo "LEGENDA:"
echo "- Valores positivos: Planilha tem mais que o sistema"
echo "- Valores negativos: Sistema tem mais que a planilha"
echo "- Diferenças podem indicar trocas registradas apenas em um local"