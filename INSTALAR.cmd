@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALAR.ps1"
if errorlevel 1 (echo INSTALACION NO VERIFICADA. Revisa el error anterior. & pause & exit /b 1)
pause
