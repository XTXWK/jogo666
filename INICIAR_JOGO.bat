@echo off
setlocal
cd /d "%~dp0"
title Raiz Bruta Arena - Renascida
where node >nul 2>nul
if errorlevel 1 goto no_node
call npm ci
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed
echo Abra http://localhost:8787 quando o servidor estiver pronto.
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:8787"
call npm start
goto finished
:no_node
echo Node.js nao encontrado. Para desenvolvimento local instale Node.js LTS.
echo Para apenas jogar, use o link publicado na conversa. Nao precisa instalar nada.
goto finished
:failed
echo Houve um erro. Copie ou fotografe a mensagem acima.
:finished
pause
