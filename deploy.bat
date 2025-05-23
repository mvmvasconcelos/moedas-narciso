@echo off
REM deploy.bat - Script para gerenciar ambiente de desenvolvimento e deploy usando Docker
setlocal enabledelayedexpansion

REM Verificar se há parâmetro
if "%1"=="" (
    echo Erro: Especifique 'local' ou 'prod' como parametro.
    echo Exemplo: deploy.bat local
    exit /b 1
)

REM Verificar parâmetro válido
if not "%1"=="local" if not "%1"=="prod" (
    echo Erro: O parametro deve ser 'local' ou 'prod'.
    echo Exemplo: deploy.bat local
    exit /b 1
)

REM Verificar se Docker está instalado
docker --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Erro: Docker nao esta instalado ou nao esta no PATH.
    exit /b 1
)

REM Verificar se o Docker está em execução
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo Erro: Docker nao esta em execucao. Por favor, inicie o Docker Desktop.
    exit /b 1
) else (
    echo [INFO] Docker esta em execucao!
)

REM Obter o diretório atual do script
set "projectDir=%~dp0"
set "projectDir=%projectDir:~0,-1%"

REM Executar o modo apropriado
if "%1"=="local" (
    call :LocalDevelopment
) else if "%1"=="prod" (
    call :VercelDeploy
)

exit /b 0

:LocalDevelopment
    echo.
    echo [INFO] Iniciando ambiente de desenvolvimento local...
    echo [INFO] Diretorio do projeto: %projectDir%
    echo [INFO] A aplicacao estara disponivel em: http://localhost:3000
    echo [INFO] Pressione Ctrl+C para encerrar o servidor de desenvolvimento
    echo.
    
    REM Iniciar container para desenvolvimento com porta 3000 mapeada
    docker run -it --rm -v "%projectDir%:/app" -p 3000:3000 -w /app node:18-alpine sh -c "npm install && npm run dev -- -p 3000"
    exit /b 0

:VercelDeploy
    echo.
    echo [INFO] Iniciando container para deploy na Vercel...
    echo [INFO] Diretorio do projeto: %projectDir%
    echo [INFO] Dentro do container, execute: vercel --prod
    echo [INFO] Digite 'exit' para sair do container
    echo.
    
    REM Iniciar container com Vercel CLI
    docker run -it --rm -v "%projectDir%:/app" vercel-cli sh
    exit /b 0
