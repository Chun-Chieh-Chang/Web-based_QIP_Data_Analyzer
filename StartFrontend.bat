@echo off
echo Starting Web-based SPC Analysis Tool Frontend...
echo.

REM Get the current directory
set "BASE_DIR=%~dp0"

echo Starting frontend server...
cd /d "%BASE_DIR%frontend"
npx vite

pause
