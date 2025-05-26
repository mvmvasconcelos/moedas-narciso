#!/bin/bash
# deploy.sh - Script para gerenciar ambiente de desenvolvimento e deploy usando Docker

# Verificar se há parâmetro
if [ -z "$1" ]; then
    echo "Erro: Especifique 'local' ou 'prod' como parâmetro."
    echo "Exemplo: ./deploy.sh local"
    exit 1
fi

# Verificar parâmetro válido
if [ "$1" != "local" ] && [ "$1" != "prod" ]; then
    echo "Erro: O parâmetro deve ser 'local' ou 'prod'."
    echo "Exemplo: ./deploy.sh local"
    exit 1
fi

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Erro: Docker não está instalado ou não está no PATH."
    exit 1
fi

# Verificar se o Docker está em execução
if ! docker info &> /dev/null; then
    echo "Erro: Docker não está em execução. Por favor, inicie o serviço Docker."
    exit 1
else
    echo "[INFO] Docker está em execução!"
fi

# Obter o diretório atual do script
PROJECT_DIR=$(pwd)

# Executar o modo apropriado
if [ "$1" = "local" ]; then
    LocalDevelopment
elif [ "$1" = "prod" ]; then
    VercelDeploy
fi

LocalDevelopment() {
    echo
    echo "[INFO] Iniciando ambiente de desenvolvimento local..."
    echo "[INFO] Diretório do projeto: $PROJECT_DIR"
    echo "[INFO] A aplicação estará disponível em: http://localhost:3000"
    echo "[INFO] Pressione Ctrl+C para encerrar o servidor de desenvolvimento"
    echo
    
    # Iniciar container para desenvolvimento com porta 3000 mapeada
    docker run -it --rm -v "$PROJECT_DIR:/app" -p 3000:3000 -w /app node:18-alpine sh -c "npm install && npm run dev -- -p 3000"
}

VercelDeploy() {
    echo
    echo "[INFO] Iniciando container para deploy na Vercel..."
    echo "[INFO] Diretório do projeto: $PROJECT_DIR"
    echo "[INFO] Dentro do container, execute: vercel --prod"
    echo "[INFO] Digite 'exit' para sair do container"
    echo
    
    # Iniciar container com Vercel CLI
    docker run -it --rm -v "$PROJECT_DIR:/app" -w /app node:18-alpine sh -c "npm install -g vercel && sh"
}

# Chamar a função apropriada
case "$1" in
    local)
        LocalDevelopment
        ;;
    prod)
        VercelDeploy
        ;;
esac
