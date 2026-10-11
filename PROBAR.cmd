@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0PROBAR.ps1"
if errorlevel 1 (pause & exit /b 1)
