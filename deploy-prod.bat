@echo off
SETLOCAL EnableDelayedExpansion

echo ==========================================
echo  Script de Deploy para Producao - Vercel
echo ==========================================
echo.

:: Tentar carregar variáveis do arquivo .env.local se existir
IF EXIST ".env.local" (
    echo Carregando variaveis de ambiente do .env.local...
    FOR /F "tokens=1,2 delims==" %%A IN ('findstr /V "^#" .env.local 2^>nul ^| findstr "="') DO (
        set "%%A=%%B"
    )
    echo [OK] Variaveis carregadas do .env.local
    echo.
)

:: Função para verificar se o Docker está rodando
docker version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Docker nao esta rodando ou nao esta instalado.
    echo Por favor, inicie o Docker Desktop e tente novamente.
    pause
    exit /b 1
)
echo [OK] Docker esta rodando

:: Verificar variáveis de ambiente necessárias
echo.
echo Verificando variaveis de ambiente...

IF "%VERCEL_TOKEN%"=="" (
    echo.
    echo [ERRO] VERCEL_TOKEN nao esta definido
    echo.
    echo Para configurar rapidamente:
    echo 1. Execute: configure-env.bat
    echo    OU
    echo 2. Acesse https://vercel.com/account/tokens
    echo 3. Crie um novo token
    echo 4. Execute: set VERCEL_TOKEN=seu_token_aqui
    echo.
    pause
    exit /b 1
)
echo [OK] VERCEL_TOKEN configurado

IF "%NEXT_PUBLIC_SUPABASE_URL%"=="" (
    echo.
    echo [ERRO] NEXT_PUBLIC_SUPABASE_URL nao esta definido
    echo.
    echo Para configurar rapidamente:
    echo 1. Execute: configure-env.bat
    echo    OU
    echo 2. Execute: set NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
    echo.
    pause
    exit /b 1
)
echo [OK] NEXT_PUBLIC_SUPABASE_URL configurado

IF "%NEXT_PUBLIC_SUPABASE_ANON_KEY%"=="" (
    echo.
    echo [ERRO] NEXT_PUBLIC_SUPABASE_ANON_KEY nao esta definido
    echo.
    echo Para configurar rapidamente:
    echo 1. Execute: configure-env.bat
    echo    OU
    echo 2. Execute: set NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
    echo.
    pause
    exit /b 1
)
echo [OK] NEXT_PUBLIC_SUPABASE_ANON_KEY configurado

echo.
echo Todas as variaveis de ambiente estao configuradas!

echo.
echo Todas as variaveis de ambiente estao configuradas!

:: Limpar o cache do Docker
echo.
echo Limpando cache do Docker...
docker system prune -f >nul 2>&1
echo [OK] Cache do Docker limpo

:: Verificar se o Dockerfile.vercel existe
IF NOT EXIST "Dockerfile.vercel" (
    echo.
    echo [ERRO] Dockerfile.vercel nao encontrado
    echo Verifique se o arquivo existe no diretorio atual
    pause
    exit /b 1
)
echo [OK] Dockerfile.vercel encontrado

:: Construir a imagem do Vercel
echo.
echo Construindo imagem do Vercel...
docker build -f Dockerfile.vercel -t moedas-narciso-vercel .
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha ao construir a imagem Docker
    echo Verifique os logs acima para mais detalhes
    pause
    exit /b %ERRORLEVEL%
)
echo [OK] Imagem Docker construida com sucesso

echo [OK] Imagem Docker construida com sucesso

:: Executar o container com as variáveis de ambiente
echo.
echo Iniciando deploy na Vercel...
echo Isso pode levar alguns minutos...
echo.

docker run --rm -it ^
    -e VERCEL_TOKEN=%VERCEL_TOKEN% ^
    -e NEXT_PUBLIC_SUPABASE_URL=%NEXT_PUBLIC_SUPABASE_URL% ^
    -e NEXT_PUBLIC_SUPABASE_ANON_KEY=%NEXT_PUBLIC_SUPABASE_ANON_KEY% ^
    -v "%cd%":/app ^
    moedas-narciso-vercel vercel deploy --prod --yes

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha durante o deploy
    echo Verifique os logs acima para mais detalhes
    echo.
    echo Possiveis causas:
    echo - Token do Vercel invalido ou expirado
    echo - Projeto nao configurado no Vercel
    echo - Problemas de conectividade
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==========================================
echo  Deploy concluido com sucesso!
echo ==========================================
echo.
echo Para verificar o status do deploy:
echo https://vercel.com/dashboard
echo.
pause