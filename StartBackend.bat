@echo off
echo Starting Web-based SPC Analysis Tool Backend...
echo.

REM Get the current directory
set "BASE_DIR=%~dp0"

echo Starting backend server...
cd /d "%BASE_DIR%backend"
python main.py

pause
