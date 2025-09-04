@echo off
SETLOCAL EnableDelayedExpansion

echo =========================================
echo  Configuracao de Variaveis de Ambiente
echo =========================================
echo.

echo Este script ira ajuda-lo a configurar as variaveis de ambiente necessarias
echo para o deploy na Vercel.
echo.

:: Verificar se .env.local já existe
IF EXIST ".env.local" (
    echo Arquivo .env.local ja existe.
    set /p overwrite="Deseja sobrescrever? (s/N): "
    IF /I NOT "!overwrite!"=="s" (
        echo Operacao cancelada.
        pause
        exit /b 0
    )
)

echo.
echo Por favor, forneca as seguintes informacoes:
echo.

:: Solicitar VERCEL_TOKEN
set /p VERCEL_TOKEN="Token do Vercel: "
IF "!VERCEL_TOKEN!"=="" (
    echo Token nao pode estar vazio.
    pause
    exit /b 1
)

:: Solicitar SUPABASE_URL
set /p SUPABASE_URL="URL do Supabase: "
IF "!SUPABASE_URL!"=="" (
    echo URL do Supabase nao pode estar vazia.
    pause
    exit /b 1
)

:: Solicitar SUPABASE_ANON_KEY
set /p SUPABASE_ANON_KEY="Chave anonima do Supabase: "
IF "!SUPABASE_ANON_KEY!"=="" (
    echo Chave anonima nao pode estar vazia.
    pause
    exit /b 1
)

:: Criar arquivo .env.local
echo # Configuracoes para deploy na Vercel > .env.local
echo # Gerado automaticamente em %date% %time% >> .env.local
echo. >> .env.local
echo VERCEL_TOKEN=!VERCEL_TOKEN! >> .env.local
echo NEXT_PUBLIC_SUPABASE_URL=!SUPABASE_URL! >> .env.local
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=!SUPABASE_ANON_KEY! >> .env.local

echo.
echo [OK] Arquivo .env.local criado com sucesso!
echo.
echo Para usar essas variaveis no terminal atual, execute:
echo call load-env.bat
echo.
echo Ou reinicie o terminal para que as variaveis sejam carregadas.
echo.
pause
