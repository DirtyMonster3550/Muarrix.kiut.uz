@echo off
chcp 65001 >nul
title Muarrix.kiut.uz — server
cd /d "%~dp0"

set "NODE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE%" set "NODE=node"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
  echo.
  echo  Сервер Muarrix.kiut.uz уже запущен на порту 3000.
  echo  Откройте: http://localhost:3000
  echo.
  echo  Чтобы перезапустить — закройте старый терминал ^(Ctrl+C^)
  echo  или выполните: taskkill /PID %%a /F
  echo.
  pause
  exit /b 0
)

echo.
echo  Muarrix.kiut.uz — Muarrix.kiut.uz
echo  http://localhost:3000
echo.
echo  Ctrl+C — остановить
echo.

"%NODE%" server.js
if errorlevel 1 pause
