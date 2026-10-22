@echo off
title Bloom Bar & Restaurant - TCP Print Bridge
color 0A
echo ========================================================
echo   Bloom Bar & Restaurant - Cloud TCP Print Bridge
echo   Connecting Cloud POS to Epson Thermal Printer
echo ========================================================
echo.
cd /d "%~dp0"
node bloom-agent.js
pause
