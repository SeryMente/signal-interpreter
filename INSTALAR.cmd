@echo off
title Signal Interpreter - Preparar este equipo
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALAR.ps1" -Interactive
exit /b %errorlevel%
