#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# deploy-prod.sh
# Versão container-first:
# - Por padrão usa imagem oficial node para executar `npx vercel deploy` dentro de um container (não roda nada no host)
# - Se USE_PROJECT_IMAGE=1 e existir Dockerfile.vercel, irá construir a imagem do projeto e executar o `vercel` dentro dela
# - Carrega .env.local (se existir) para expor as variáveis necessárias ao container

PROJECT_DIR="$(pwd)"
DEFAULT_NODE_IMAGE="node:18-slim"
PROJECT_IMAGE_NAME="moedas-narciso-vercel"

echo "[INFO] Diretório do projeto: $PROJECT_DIR"

load_env_file() {
  local envfile="$1"
  [ -f "$envfile" ] || return 0

  echo "[INFO] Carregando variáveis de ambiente de $envfile"
  # exporta linhas KEY=VAL, ignorando comentários e linhas vazias
  while IFS='=' read -r key val; do
    # pular linhas vazias ou linhas que começam com #
    [[ -z "$key" ]] && continue
    if [[ "$key" =~ ^[[:space:]]*# ]]; then
      continue
    fi
  key=$(echo "$key" | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')
  # remover aspas simples/duplas ao redor do valor de forma segura
  val=$(echo "${val:-}" | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')
  # remover aspas correspondentes nas duas pontas (ex: "valor" ou 'valor')
  if [ -n "$val" ]; then
    first="${val:0:1}"
    last="${val: -1}"
    if [ "$first" = '"' ] && [ "$last" = '"' ]; then
      val="${val:1:-1}"
    elif [ "$first" = "'" ] && [ "$last" = "'" ]; then
      val="${val:1:-1}"
    fi
  fi
  export "$key"="$val"
  done < <(grep -v '^[[:space:]]*#' "$envfile" 2>/dev/null || true)
}

# Carregar .env.local se existir
if [ -f .env.local ]; then
  load_env_file .env.local
else
  echo "[WARN] .env.local não encontrado. Continue se as variáveis já estiverem exportadas no ambiente."
fi

# Variáveis mínimas
if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "[ERRO] VERCEL_TOKEN não definido. Defina em .env.local ou exporte no ambiente." >&2
  exit 1
fi

# Preparar lista de -e para docker run (passar apenas variáveis que existam)
DOCKER_ENV_ARGS=("-e" "VERCEL_TOKEN=$VERCEL_TOKEN")
if [ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]; then
  DOCKER_ENV_ARGS+=("-e" "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL")
fi
if [ -n "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]; then
  DOCKER_ENV_ARGS+=("-e" "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY")
fi

# Modo: se USE_PROJECT_IMAGE=1 e Dockerfile.vercel existir -> build + run imagem do projeto (opção 2)
USE_PROJECT_IMAGE="${USE_PROJECT_IMAGE:-0}"
if [ "$USE_PROJECT_IMAGE" = "1" ] && [ -f Dockerfile.vercel ]; then
  echo "[INFO] USE_PROJECT_IMAGE=1 e Dockerfile.vercel encontrado -> irá construir a imagem do projeto"
  echo "[INFO] Executando: docker build -f Dockerfile.vercel -t $PROJECT_IMAGE_NAME ."
  docker build -f Dockerfile.vercel -t "$PROJECT_IMAGE_NAME" .

  echo "[INFO] Executando o deploy dentro da imagem do projeto (projeto deverá incluir o CLI ou npx)..."
  docker run --rm -it \
    "${DOCKER_ENV_ARGS[@]}" \
    -v "$PROJECT_DIR":/app -w /app \
    "$PROJECT_IMAGE_NAME" sh -lc "npx --yes vercel deploy --prod --yes"

  EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    echo "[ERRO] Deploy falhou (código: $EXIT_CODE)" >&2
    exit $EXIT_CODE
  fi

  echo "[OK] Deploy concluído com sucesso usando a imagem do projeto."
  exit 0
fi

# Caso padrão: usar imagem oficial do Node para rodar npx vercel
echo "[INFO] Usando imagem oficial $DEFAULT_NODE_IMAGE para executar npx vercel (opção 3)"
# Em vez de instalar no repositório local, criamos um diretório temporário,
# injetamos a dependência @vercel/analytics e rodamos o deploy a partir dele.
TMP_DIR="$(mktemp -d)"
echo "[INFO] Criando diretório temporário: $TMP_DIR"

cleanup() {
  echo "[INFO] Limpando diretório temporário"
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "[INFO] Copiando projeto para o diretório temporário (exclui node_modules e .git)..."
if command -v rsync >/dev/null 2>&1; then
  rsync -a --exclude 'node_modules' --exclude '.git' ./ "$TMP_DIR"
else
  # fallback simples se rsync não existir
  (cd "$PROJECT_DIR" && cp -a . "$TMP_DIR")
fi

echo "[INFO] Injetando @vercel/analytics no package.json temporário e instalando dependências dentro de um container Node"
# Usamos um container Node para modificar o package.json e instalar dependências,
# assim não poluímos o host local. Usamos npm install (mais permissivo que npm ci)
docker run --rm -v "$TMP_DIR":/app -w /app "$DEFAULT_NODE_IMAGE" sh -lc \
  "node -e \"let fs=require('fs');let p=require('./package.json');p.dependencies=p.dependencies||{};p.dependencies['@vercel/analytics']='latest';fs.writeFileSync('package.json', JSON.stringify(p,null,2));\" && npm install --no-audit --prefer-offline"

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  echo "[ERRO] Falha ao instalar dependências no diretório temporário (código: $EXIT_CODE)" >&2
  exit $EXIT_CODE
fi

echo "[INFO] Executando deploy da Vercel a partir do diretório temporário"
docker run --rm -it \
  "${DOCKER_ENV_ARGS[@]}" \
  -v "$TMP_DIR":/app -w /app \
  "$DEFAULT_NODE_IMAGE" sh -lc "npx --yes vercel deploy --prod --yes"

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  echo "[ERRO] Deploy falhou (código: $EXIT_CODE)" >&2
  exit $EXIT_CODE
fi

echo "[OK] Deploy concluído com sucesso usando diretório temporário."
