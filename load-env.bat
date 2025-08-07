@echo off
SETLOCAL EnableDelayedExpansion

echo Carregando variaveis de ambiente do .env.local...

IF NOT EXIST ".env.local" (
    echo [ERRO] Arquivo .env.local nao encontrado.
    echo Execute configure-env.bat primeiro para criar o arquivo.
    pause
    exit /b 1
)

:: Ler e definir variáveis do arquivo .env.local
FOR /F "tokens=1,2 delims==" %%A IN ('findstr /V "^#" .env.local 2^>nul ^| findstr "="') DO (
    set "%%A=%%B"
    echo [OK] %%A definido
)

echo.
echo Variaveis carregadas com sucesso!
echo Agora voce pode executar deploy-prod.bat
echo.
