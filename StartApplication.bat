@echo off
echo Starting Web-based SPC Analysis Tool...
echo.

REM Get the current directory
set "BASE_DIR=%~dp0"

echo Starting backend server...
start "SPC Backend" cmd /k "cd /d "%BASE_DIR%backend" & python main.py"

timeout /t 5 /nobreak >nul

echo Starting frontend server...
start "SPC Frontend" cmd /k "cd /d "%BASE_DIR%frontend" & npx vite"

echo.
echo Application started successfully!
echo Backend: Will be available on http://localhost:8000 (or higher port if busy)
echo Frontend: Will be available on http://localhost:5173
echo.
echo Access the application at: http://localhost:5173
echo.
pause