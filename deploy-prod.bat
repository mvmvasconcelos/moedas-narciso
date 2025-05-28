@echo off
SETLOCAL EnableDelayedExpansion

:: Verificar variáveis de ambiente necessárias
IF "%VERCEL_TOKEN%"=="" (
    echo Erro: VERCEL_TOKEN não está definido
    exit /b 1
)
IF "%NEXT_PUBLIC_SUPABASE_URL%"=="" (
    echo Erro: NEXT_PUBLIC_SUPABASE_URL não está definido
    exit /b 1
)
IF "%NEXT_PUBLIC_SUPABASE_ANON_KEY%"=="" (
    echo Erro: NEXT_PUBLIC_SUPABASE_ANON_KEY não está definido
    exit /b 1
)

:: Limpar o cache do Docker
echo Limpando cache do Docker...
docker system prune -f

:: Construir a imagem do Vercel
echo Construindo imagem do Vercel...
docker build -f Dockerfile.vercel -t moedas-narciso-vercel .
IF %ERRORLEVEL% NEQ 0 (
    echo Erro ao construir a imagem Docker
    exit /b %ERRORLEVEL%
)

:: Executar o container com as variáveis de ambiente
echo Iniciando deploy na Vercel...
docker run --rm -it ^
    -e VERCEL_TOKEN=%VERCEL_TOKEN% ^
    -e NEXT_PUBLIC_SUPABASE_URL=%NEXT_PUBLIC_SUPABASE_URL% ^
    -e NEXT_PUBLIC_SUPABASE_ANON_KEY=%NEXT_PUBLIC_SUPABASE_ANON_KEY% ^
    -v %cd%:/app ^
    moedas-narciso-vercel vercel deploy --prod

IF %ERRORLEVEL% NEQ 0 (
    echo Erro durante o deploy. Por favor, verifique os logs acima.
    exit /b %ERRORLEVEL%
)

echo Deploy concluído com sucesso!
echo Para verificar o status do deploy, acesse: https://vercel.com/dashboard