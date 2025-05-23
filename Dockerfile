FROM node:18-alpine

# Instalar o Vercel CLI globalmente
RUN npm install -g vercel

# Definir o diretório de trabalho
WORKDIR /app

# Copiar os arquivos do projeto
COPY . .

# Comando padrão quando o container iniciar
CMD ["sh"]
