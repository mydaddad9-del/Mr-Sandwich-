@echo off
title Baba Roti Cafe - Local POS Server
cls
echo ========================================================
echo   Baba Roti Cafe - Local Network POS Server
echo ========================================================
echo.
echo Starting local server on port 5000...
echo This connects directly to your local printer at 10.241.18.48:9100
echo.
cd /d "%~dp0"
node server/server.js
pause
