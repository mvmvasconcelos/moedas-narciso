# Desenvolvimento com Docker

Este documento explica como usar o Docker para desenvolvimento local no projeto Moedas-Narciso.

## Requisitos

- Docker instalado e em execução no seu sistema
- Git para clonar o repositório

## Executando com o Script

O projeto inclui um script `deploy.bat` para facilitar o desenvolvimento:

```bash
.\deploy.bat local
```

Este comando:
1. Verifica se o Docker está instalado e em execução
2. Inicia um container com Node.js 18 Alpine
3. Monta o diretório do projeto dentro do container
4. Instala as dependências e inicia o servidor de desenvolvimento
5. Mapeia a porta 3000 para acesso local

## Comando Docker Manual

Se preferir executar o Docker manualmente:

### No PowerShell (Windows):

```powershell
$currentPath = (Get-Location).Path
docker run -it --rm -v "${currentPath}:/app" -p 3000:3000 -w /app node:18-alpine sh -c "npm install && npm run dev -- -p 3000"
```

### No Bash (Linux/Mac):

```bash
docker run -it --rm -v "$(pwd):/app" -p 3000:3000 -w /app node:18-alpine sh -c "npm install && npm run dev -- -p 3000"
```

## Usando Turbopack

Para executar o desenvolvimento com Turbopack para compilação mais rápida:

```bash
docker run -it --rm -v "${currentPath}:/app" -p 3000:3000 -w /app node:18-alpine sh -c "npm install && npm run dev -- --turbo -p 3000"
```

## Depuração no Container

Para entrar no container e executar comandos manualmente:

```powershell
docker run -it --rm -v "${currentPath}:/app" -p 3000:3000 -w /app node:18-alpine sh
```

Dentro do container, você pode executar:
```bash
npm install           # Instalar dependências
npm run dev           # Iniciar servidor de desenvolvimento
npm run lint          # Verificar linting
npm run build         # Criar build de produção
```

## Resolução de Problemas

### Erro de permissão no Windows
Se encontrar erros de permissão no Windows, tente:

```powershell
docker run -it --rm -v "${currentPath}:/app:Z" -p 3000:3000 -w /app node:18-alpine sh -c "npm install && npm run dev -- -p 3000"
```

### Problemas de cache
Para limpar o cache do Next.js:

```bash
docker run -it --rm -v "${currentPath}:/app" -w /app node:18-alpine sh -c "rm -rf .next && npm run dev -- -p 3000"
```

### Problemas com node_modules
Se tiver problemas com node_modules:

```bash
docker run -it --rm -v "${currentPath}:/app" -w /app node:18-alpine sh -c "rm -rf node_modules && npm install && npm run dev -- -p 3000"
```
