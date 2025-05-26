FROM node:18-alpine

# Instalar o Vercel CLI globalmente
RUN npm install -g vercel

# Definir o diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro para aproveitar o cache do Docker
COPY package.json package-lock.json* ./

# Instalar dependências
RUN npm ci || npm install

# Copiar o restante dos arquivos do projeto
COPY . .

# Expor a porta 3000
EXPOSE 3000

# Comando padrão quando o container iniciar
CMD ["sh"]
