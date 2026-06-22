@echo off
:: ============================================================
:: setup-openclaw.bat
:: Chay script nay de cau hinh OpenClaw voi API key tu .env
:: ============================================================

SET SCRIPT_DIR=%~dp0

:: Doc API key tu file .env
FOR /F "tokens=1,2 delims==" %%A IN ('findstr /v "^#" "%SCRIPT_DIR%.env"') DO (
    SET %%A=%%B
)

IF "%OPENROUTER_API_KEY%"=="" (
    echo [LOI] Khong tim thay OPENROUTER_API_KEY trong file .env
    echo Hay mo file .env va dien API key vao.
    pause
    exit /b 1
)

echo [INFO] Dang cau hinh OpenClaw voi OpenRouter API key...

:: Cau hinh API key cho openrouter-worker
openclaw agents auth openrouter-worker --api-key %OPENROUTER_API_KEY%

IF %ERRORLEVEL% EQU 0 (
    echo [OK] Cau hinh thanh cong!
) ELSE (
    echo [THU CACH KHAC] Dang thu cach cau hinh khac...
    openclaw auth set --provider openrouter --key %OPENROUTER_API_KEY%
)

echo.
echo Hoan tat. Ban co the restart OpenClaw.
pause
