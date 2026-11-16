@echo off
title Prato Certo - Servidor Local
cd /d "%~dp0"

echo.
echo ========================================
echo   PRATO CERTO - SERVIDOR SOMENTE LOCAL
echo ========================================
echo.
echo O site sera aberto em http://127.0.0.1:5173
echo Feche esta janela para desligar o site.
echo.

start "" cmd /c "timeout /t 3 /nobreak >nul && start http://127.0.0.1:5173/"
call npm run dev -- --host 127.0.0.1

pause
