@echo off
title Bloom Bar and Restaurant  Cafe - POS Server
cls
echo ========================================================
echo   Bloom Bar and Restaurant  Cafe - Restaurant POS Server
echo ========================================================
echo.
echo Starting restaurant server on port 5000...
echo Network Printer IP Mode (Port 9100) is ACTIVE.
echo.
cd /d "%~dp0"
timeout /t 2 /nobreak >nul
start "" http://localhost:5000
node server/server.js
pause
