@echo off
title Corp Messenger — Деплой

echo ==========================================
echo   Corp Messenger — Сборка + Деплой
echo ==========================================
echo.

cd /d C:\laragon\www\messenger

echo [1/2] Сборка фронтенда...
call npm run build
if %errorlevel% neq 0 (
    echo Ошибка сборки!
    pause
    exit /b 1
)
echo OK

echo [2/2] Копирование в C:\laragon\www\messenger-app...
if exist "C:\laragon\www\messenger-app" (
    rmdir /s /q "C:\laragon\www\messenger-app"
)
xcopy dist\* C:\laragon\www\messenger-app\ /E /I /Y >nul
echo OK

echo.
echo ==========================================
echo   Готово!
echo   Сайт: http://localhost/messenger-app/
echo ==========================================
echo.
pause
