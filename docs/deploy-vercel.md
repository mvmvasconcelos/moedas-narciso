# Deploy para Vercel - Instruções

Este documento explica como realizar o deploy da aplicação para a Vercel usando Docker.

## Pré-requisitos

1. **Docker Desktop** instalado e rodando
2. **Conta na Vercel** com token de acesso
3. **Projeto Supabase** configurado

## Configuração Inicial

### Opção 1: Configuração Automática (Recomendado)

1. Execute o script de configuração:
   ```cmd
   configure-env.bat
   ```

2. Forneça as informações solicitadas:
   - Token do Vercel (obtenha em: https://vercel.com/account/tokens)
   - URL do Supabase
   - Chave anônima do Supabase

### Opção 2: Configuração Manual

1. Copie o arquivo de exemplo:
   ```cmd
   copy .env.example .env.local
   ```

2. Edite o arquivo `.env.local` com seus valores reais

3. Carregue as variáveis no terminal:
   ```cmd
   load-env.bat
   ```

## Realizando o Deploy

Após configurar as variáveis de ambiente, execute:

```cmd
deploy-prod.bat
```

O script irá:
1. Verificar se o Docker está rodando
2. Validar todas as variáveis de ambiente
3. Construir a imagem Docker do Vercel
4. Executar o deploy para produção

## Troubleshooting

### Erro: "Docker não está rodando"
- Certifique-se de que o Docker Desktop está iniciado
- Execute `docker version` para verificar

### Erro: "VERCEL_TOKEN não está definido"
- Execute `configure-env.bat` para configurar as variáveis
- Ou defina manualmente: `set VERCEL_TOKEN=seu_token`

### Erro: "Falha ao construir a imagem Docker"
- Verifique se o arquivo `Dockerfile.vercel` existe
- Certifique-se de que está no diretório correto do projeto

### Erro: "Falha durante o deploy"
- Verifique se o token do Vercel é válido
- Certifique-se de que o projeto está configurado na Vercel
- Verifique sua conexão com a internet

## Arquivos Relacionados

- `deploy-prod.bat` - Script principal de deploy
- `configure-env.bat` - Script de configuração de variáveis
- `load-env.bat` - Script para carregar variáveis do .env.local
- `Dockerfile.vercel` - Container para o Vercel CLI
- `.env.example` - Exemplo de configuração
- `.env.local` - Suas configurações (não commitado)

## Comandos Úteis

```cmd
# Verificar status do Docker
docker version

# Limpar cache do Docker
docker system prune -f

# Verificar variáveis de ambiente
echo %VERCEL_TOKEN%
echo %NEXT_PUBLIC_SUPABASE_URL%

# Recarregar variáveis de ambiente
load-env.bat
```

## Links Úteis

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Tokens](https://vercel.com/account/tokens)
- [Supabase Dashboard](https://app.supabase.com/)
