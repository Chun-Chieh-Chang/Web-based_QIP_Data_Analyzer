@echo off
echo Starting Web-based SPC Analysis Tool (Local Mode)...
echo.

REM Get the current directory
set "BASE_DIR=%~dp0"

echo Starting frontend server...
cd /d "%BASE_DIR%frontend"
start "SPC Frontend" npx vite

echo.
echo Application started successfully!
echo.
echo Access the application at: http://localhost:5173
echo.
pause