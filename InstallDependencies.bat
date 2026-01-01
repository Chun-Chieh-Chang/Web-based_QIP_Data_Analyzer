@echo off
echo Installing dependencies for Web-based SPC Analysis Tool...
echo.

REM Get the current directory
set "BASE_DIR=%~dp0"

echo Installing Python dependencies...
cd /d "%BASE_DIR%backend"
pip install -r requirements.txt

echo.
echo Installing Node.js dependencies...
cd /d "%BASE_DIR%frontend"
npm install

echo.
echo Installation completed!
echo You can now run the application using StartApplication.bat
echo.
pause
