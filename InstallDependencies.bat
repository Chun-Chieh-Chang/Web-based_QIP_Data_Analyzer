@echo off
echo Installing dependencies for Web-based SPC Analysis Tool (Local Mode)...
echo.

REM Get the current directory
set "BASE_DIR=%~dp0"

echo Installing Node.js dependencies...
cd /d "%BASE_DIR%frontend"
npm install

echo.
echo Installation completed!
echo You can now run the application using StartApplication.bat
echo.
pause
