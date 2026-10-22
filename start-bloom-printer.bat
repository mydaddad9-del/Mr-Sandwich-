@echo off
title Bloom Bar & Restaurant - TCP Print Bridge
color 0A
echo ========================================================
echo   Bloom Bar & Restaurant - Cloud TCP Print Bridge
echo   Connecting Cloud POS to All Order Printers (Kitchen, Bar, Cashier)
echo   Supports Epson, Star, Bixolon, Citizen, Datecs & Generic ESC/POS
echo.
cd /d "%~dp0"
node bloom-agent.js
pause
