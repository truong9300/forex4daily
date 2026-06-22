@echo off
chcp 65001 >nul
title OpenClaw Setup - OpenRouter

echo ==========================================
echo   OpenClaw Setup voi OpenRouter
echo ==========================================
echo.

:: Kiem tra OpenClaw da cai chua
where openclaw >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] OpenClaw da duoc cai dat.
) else (
    echo [*] Dang cai OpenClaw...
    powershell -ExecutionPolicy Bypass -Command "irm https://openclaw.ai/install.ps1 | iex"
    if %errorlevel% neq 0 (
        echo [LOI] Cai dat that bai. Kiem tra ket noi mang.
        pause
        exit /b 1
    )
    echo [OK] Cai dat thanh cong.
)

echo.
:: Nhap API key
set /p OPENROUTER_KEY="Nhap OpenRouter API key (sk-or-...): "

if "%OPENROUTER_KEY%"=="" (
    echo [LOI] API key khong duoc de trong.
    pause
    exit /b 1
)

:: Cau hinh OpenRouter
echo.
echo [*] Dang cau hinh OpenRouter...
openclaw onboard --auth-choice apiKey --token-provider openrouter --token "%OPENROUTER_KEY%"

if %errorlevel% == 0 (
    echo.
    echo [OK] Cau hinh thanh cong!
    echo.
    echo Ban co the dung cac model sau:
    echo   openrouter/openrouter/auto
    echo   openrouter/anthropic/claude-3.5-sonnet
    echo   openrouter/nvidia/nemotron-3-8b-instruct
    echo   openrouter/poolside/laguna-m1
    echo.
    echo Chay lenh: openclaw
) else (
    echo [LOI] Cau hinh that bai. Kiem tra lai API key.
)

echo.
pause
