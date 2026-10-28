@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALAR.ps1"
if errorlevel 1 (
  echo.
  echo ERROR: El puente nativo no quedo verificado. No cargues la extension todavia.
  pause
  exit /b 1
)
echo.
echo Puente nativo verificado e instalado para este usuario de Windows.
echo La extension aun debe cargarse manualmente en Chrome.
echo Selecciona la raiz de esta carpeta: debe contener manifest.json.
start "" "chrome://extensions"
start "" explorer.exe "%~dp0"
pause
