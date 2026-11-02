@echo off
title Mr Sandwich - POS Hybrid Print Bridge
color 0A
echo ========================================================
echo   Mr Sandwich - Cloud-to-Local POS TCP Print Bridge
echo   Connecting Cloud POS to All Order Printers (Kitchen, Bar, Cashier)
echo   Supports Epson, Star, Bixolon, Citizen, Datecs & HP LaserJet
echo ========================================================
echo.
cd /d "%~dp0"
node pos-agent.js
pause
