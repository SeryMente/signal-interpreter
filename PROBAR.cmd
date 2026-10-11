@echo off
title Signal Interpreter - Prueba sin llamadas
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0PROBAR.ps1" -Interactive
exit /b %errorlevel%
