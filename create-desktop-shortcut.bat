@echo off
title Create Mr Sandwich Desktop Shortcut
color 0A
echo ========================================================
echo   Creating Desktop Shortcut for Mr Sandwich Printer Agent
echo ========================================================
echo.
cd /d "%~dp0"

set "PROJECT_DIR=%~dp0"
:: Remove trailing backslash if present
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

:: 1. Create .bat launcher directly on Desktop (matches "Start Bloom Printer Agent.bat")
echo Creating "Start Mr Sandwich Printer Agent.bat" on Desktop...
(
  echo @echo off
  echo title Mr Sandwich POS Print Bridge
  echo echo Starting Mr Sandwich Printer Agent...
  echo cd /d "%PROJECT_DIR%"
  echo node pos-agent.js
  echo pause
) > "%USERPROFILE%\Desktop\Start Mr Sandwich Printer Agent.bat"

:: 2. Create Windows Shortcut (.lnk) on Desktop with Gear icon (matches "Start Baba Roti Printer Agent.lnk")
echo Creating "Start Mr Sandwich Printer Agent.lnk" on Desktop...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$desktop = [Environment]::GetFolderPath('Desktop');" ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$s = $ws.CreateShortcut((Join-Path $desktop 'Start Mr Sandwich Printer Agent.lnk'));" ^
  "$s.TargetPath = 'wscript.exe';" ^
  "$s.Arguments = '\"%PROJECT_DIR%\pos-agent-hidden.vbs\"';" ^
  "$s.WorkingDirectory = '%PROJECT_DIR%';" ^
  "$s.IconLocation = '%SystemRoot%\System32\shell32.dll,71';" ^
  "$s.Description = 'Mr Sandwich Hybrid Cloud-to-Local Print Agent';" ^
  "$s.Save();"

echo.
echo ========================================================
echo [SUCCESS] Desktop shortcuts created successfully!
echo   1. Desktop\Start Mr Sandwich Printer Agent.bat (Interactive debug)
echo   2. Desktop\Start Mr Sandwich Printer Agent.lnk (Silent background)
echo ========================================================
echo.
pause
