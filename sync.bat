@echo off
:: ============================================================
:: sync.bat
:: Dong bo config tu GitHub va chay setup OpenClaw
:: Co the them vao Task Scheduler de chay tu dong
:: ============================================================

SET REPO_DIR=%~dp0

echo [INFO] Dang dong bo tu GitHub...
git -C "%REPO_DIR%" pull origin main

IF %ERRORLEVEL% NEQ 0 (
    echo [LOI] Khong the dong bo tu GitHub. Kiem tra ket noi mang.
    pause
    exit /b 1
)

echo [INFO] Dong bo thanh cong. Dang chay setup...
call "%REPO_DIR%setup-openclaw.bat"
