@echo off
REM deploy.bat - Script simplificado para executar o ambiente Docker local
setlocal enabledelayedexpansion

echo [INFO] Verificando se o Docker está instalado...
docker --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Docker não está instalado ou não está no PATH. Por favor instale o Docker Desktop.
    exit /b 1
)

echo [INFO] Verificando se o Docker Compose está disponível...
docker compose version > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Docker Compose não está disponível. Verifique a instalação do Docker Desktop.
    exit /b 1
)

echo [INFO] Iniciando o ambiente de desenvolvimento...
echo [INFO] Certifique-se que o Docker Desktop está em execução
echo [INFO] A aplicação estará disponível em: http://localhost:3000
echo [INFO] Pressione Ctrl+C para encerrar o servidor de desenvolvimento
echo.

REM Executar docker compose
docker compose down --remove-orphans
docker compose up
echo [INFO] Encerrando containers...
docker compose down --remove-orphans
exit /b 0
