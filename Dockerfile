FROM node:18-alpine

# Definir o diretório de trabalho
WORKDIR /app

# Copiar apenas os arquivos de dependências primeiro
COPY package.json package-lock.json* ./

# Instalar as dependências do projeto
RUN npm install

# Copiar o restante do código para dentro do container
COPY . .

# Expor a porta 3000
EXPOSE 3000

# Comando padrão quando o container iniciar
CMD ["sh"]
