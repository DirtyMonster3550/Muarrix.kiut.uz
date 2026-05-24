@echo off
title KIUT Ilmiy Nashrlar - Server
echo.
echo  ============================================
echo   KIUT Ilmiy Nashrlar - Запуск сервера
echo  ============================================
echo.
echo  Сайт будет доступен по адресу:
echo  http://localhost:3000
echo.
echo  Админ: dr.admin35@gmail.com
echo.
echo  НЕ ЗАКРЫВАЙТЕ это окно - сервер работает
echo  Для остановки нажмите Ctrl+C
echo  ============================================
echo.
cd /d "%~dp0"
node server.js
pause
