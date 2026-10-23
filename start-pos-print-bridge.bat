@echo off
title Mr Sandwich - POS TCP Print Bridge
color 0A
echo ====================================================
echo   Mr Sandwich - Local TCP Print Bridge
echo   Connecting Cloud POS to Local Thermal Printers
echo ====================================================
echo.
cd /d "%~dp0server"
echo Checking local printer connectivity...
node -e "const { testPrinter } = require('./utils/printService'); testPrinter('10.241.18.48', 9100).then(r => console.log('Epson 10.241.18.48 Port 9100:', r.ok ? 'ONLINE [OK]' : 'OFFLINE')).catch(() => console.log('Checking network...'));"
echo.
echo Starting Local Print Bridge on Port 5000...
npm run dev
pause
