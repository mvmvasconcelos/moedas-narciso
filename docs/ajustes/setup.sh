#!/bin/bash

echo "🔧 SETUP DOS SCRIPTS DE DIAGNÓSTICO"
echo "=================================="
echo ""

# Verificar se estamos na pasta correta
if [[ ! -f "README.md" ]]; then
    echo "❌ Execute este script na pasta /docs/ajustes"
    echo "   cd /docs/ajustes && ./setup.sh"
    exit 1
fi

echo "✅ Pasta correta detectada"

# Dar permissões de execução
echo "🔑 Configurando permissões de execução..."
chmod +x *.sh
echo "✅ Permissões configuradas"

# Verificar dependências
echo ""
echo "🔍 Verificando dependências..."

# Verificar psql
if command -v psql &> /dev/null; then
    echo "✅ psql encontrado"
else
    echo "⚠️  psql não encontrado - comandos de banco não funcionarão"
    echo "   Para instalar: sudo apt install postgresql-client"
fi

# Verificar python3
if command -v python3 &> /dev/null; then
    echo "✅ python3 encontrado"
else
    echo "❌ python3 não encontrado - script Python não funcionará"
fi

# Verificar psycopg2 para Python (opcional)
if python3 -c "import psycopg2" 2>/dev/null; then
    echo "✅ psycopg2 disponível para Python"
else
    echo "ℹ️  psycopg2 não encontrado (opcional)"
    echo "   Para instalar: pip install psycopg2-binary"
fi

echo ""
echo "📋 STATUS DOS ARQUIVOS:"

# Verificar arquivos essenciais
files=("compare_bash.sh" "diff_materiais.sh" "README.md" "QUICK_REFERENCE.md")

for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ $file - FALTANDO"
    fi
done

echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo ""
echo "1. Coloque sua planilha atualizada como 'atualizado.csv'"
echo "2. Configure sua connection string do banco"  
echo "3. Execute: ./compare_bash.sh para testar"
echo ""

# Criar pasta para problemas históricos se não existir
if [[ ! -d "problemas" ]]; then
    mkdir -p problemas
    echo "📁 Criada pasta 'problemas' para histórico"
fi

echo "🎉 Setup concluído!"
echo ""
echo "COMANDOS ESSENCIAIS:"
echo "  ./compare_bash.sh     - Comparação completa"
echo "  ./diff_materiais.sh   - Só diferenças de materiais"
echo "  cat QUICK_REFERENCE.md - Comandos SQL úteis"
echo ""
echo "📖 Para mais detalhes: cat README.md"