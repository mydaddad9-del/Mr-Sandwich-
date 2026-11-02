@echo off
title Uninstall POS Print Agent Startup
color 0E
echo ========================================================
echo   Removing POS Print Agent from Windows Startup
echo ========================================================
echo.
del /f /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\POS-Print-Agent.lnk" 2>nul
del /f /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\POS-Print-Agent.bat" 2>nul
echo [OK] POS Print Agent shortcut removed from Windows Startup.
echo The agent will no longer start automatically on Windows boot.
echo.
pause
