FROM node:18-alpine

# Instalar dependências do sistema necessárias
RUN apk add --no-cache libc6-compat

# Habilitar cache do npm globalmente
RUN npm config set cache /npm-cache --global

# Definir o diretório de trabalho
WORKDIR /app

# Copiar apenas os arquivos de dependências primeiro
COPY package.json package-lock.json* ./

# Instalar dependências usando npm ci (mais rápido e determinístico)
RUN --mount=type=cache,target=/npm-cache \
    npm ci --prefer-offline --no-audit

# Copiar o restante do código
COPY . .

# Configurar variáveis de ambiente para otimização
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV WATCHPACK_POLLING=true

# Expor a porta
EXPOSE 3000

# Configurar volume para node_modules (evita sincronização desnecessária)
VOLUME /app/node_modules

# Comando para desenvolvimento
CMD ["npm", "run", "dev"]
