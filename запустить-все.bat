@echo off
title Corp Messenger — Запуск

echo ==========================================
echo   Corp Messenger — Запуск проекта
echo ==========================================
echo.
echo Запускаю бэкенд (порт 3001)...

start "Messenger API" cmd /k "cd /d C:\laragon\www\messenger\server && echo [API] Сервер запускается... && npm run dev"

timeout /t 3 /nobreak >nul

echo Запускаю фронтенд (порт 5173)...

start "Messenger Frontend" cmd /k "cd /d C:\laragon\www\messenger && echo [Frontend] Dev-сервер запускается... && npm run dev"

echo.
echo ==========================================
echo   Оба сервера запускаются.
echo.
echo   Фронтенд: http://localhost:5173
echo   API:      http://localhost:3001
echo.
echo   Закройте окна чтобы остановить.
echo ==========================================
echo.
pause
