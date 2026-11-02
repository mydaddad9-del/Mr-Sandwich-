@echo off
title Install POS Print Agent on Windows Startup
color 0B
echo ========================================================
echo   Auto-Start Installer: POS Hybrid Print Bridge Agent
echo ========================================================
echo.
cd /d "%~dp0"

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET_VBS=%~dp0pos-agent-hidden.vbs"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\POS-Print-Agent.lnk"

echo Target VBS: %TARGET_VBS%
echo Startup Folder: %STARTUP_FOLDER%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%TARGET_VBS%\"'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'Silent POS Cloud-to-Local Print Bridge Agent'; $s.Save()"

if exist "%SHORTCUT_PATH%" (
  color 0A
  echo [SUCCESS] Auto-start shortcut created successfully!
  echo   %SHORTCUT_PATH%
  echo.
  echo The POS Print Agent will now launch automatically in the background
  echo every time Windows boots!
) else (
  color 0E
  echo Creating fallback startup batch script...
  echo @echo off > "%STARTUP_FOLDER%\POS-Print-Agent.bat"
  echo cd /d "%~dp0" >> "%STARTUP_FOLDER%\POS-Print-Agent.bat"
  echo start "" wscript "pos-agent-hidden.vbs" >> "%STARTUP_FOLDER%\POS-Print-Agent.bat"
  echo [SUCCESS] Created startup batch launcher in Startup folder.
)

echo.
echo Launching the background agent now...
start "" wscript "%TARGET_VBS%"
echo [OK] Background print agent is now active!
echo.
pause
