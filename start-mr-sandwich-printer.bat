@echo off
title Mr Sandwich - TCP Print Bridge
color 0A
echo ========================================================
echo   Mr Sandwich - Cloud TCP Print Bridge
echo   Connecting Cloud POS to All Order Printers (Kitchen, Bar, Cashier)
echo   Supports Epson, Star, Bixolon, Citizen, Datecs & Generic ESC/POS
echo ========================================================
echo.
cd /d "%~dp0"
node mr-sandwich-agent.js
pause
