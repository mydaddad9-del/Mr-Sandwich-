@echo off
title Stop POS Print Agent
color 0C
echo ========================================================
echo   Stopping POS Print Bridge Agent
echo ========================================================
echo.
echo Stopping any running pos-agent processes...
wmic process where "commandline like '%%pos-agent.js%%' and name='node.exe'" delete 2>nul
wmic process where "commandline like '%%mr-sandwich-agent.js%%' and name='node.exe'" delete 2>nul
taskkill /F /FI "WINDOWTITLE eq POS Hybrid Print Agent*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Mr Sandwich - TCP Print Bridge*" 2>nul
echo.
echo [OK] Print agent stopped.
timeout /t 2 >nul
