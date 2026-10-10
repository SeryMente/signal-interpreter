@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0native\prepare-caption-runtime.ps1"
if errorlevel 1 exit /b 1
exit /b 0
