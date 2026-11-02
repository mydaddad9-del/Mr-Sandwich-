@echo off
title POS Hybrid Print Agent - Mr Sandwich
color 0A
echo ========================================================
echo   POS Hybrid Cloud-to-Local Print Bridge Agent
echo   Connecting Cloud POS to Local Thermal & Laser Printers
echo   Supports Epson, Star, Citizen, Datecs, Bixolon & HP LaserJet
echo ========================================================
echo.
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
  color 0C
  echo [ERROR] Node.js is not installed or not found in system PATH!
  echo Please install Node.js from https://nodejs.org and try again.
  echo.
  pause
  exit /b 1
)

echo Starting POS Print Bridge Agent in interactive mode...
echo (Close this window or press Ctrl+C to stop the agent)
echo.
node pos-agent.js
pause
