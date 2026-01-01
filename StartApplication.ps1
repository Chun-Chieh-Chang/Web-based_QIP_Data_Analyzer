# PowerShell script to start the Web-based SPC Analysis Tool

Write-Host "Starting Web-based SPC Analysis Tool..." -ForegroundColor Green
Write-Host ""

# Get the current directory
$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting backend server..." -ForegroundColor Yellow
$BackendDir = Join-Path $BaseDir "backend"
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d `"$BackendDir`" & python main.py" -WindowStyle Normal

Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Starting frontend server..." -ForegroundColor Yellow
$FrontendDir = Join-Path $BaseDir "frontend"
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d `"$FrontendDir`" & npx vite" -WindowStyle Normal

Write-Host ""
Write-Host "Application started successfully!" -ForegroundColor Green
Write-Host "Backend: Will be available on http://localhost:8000 (or higher port if busy)" -ForegroundColor Cyan
Write-Host "Frontend: Will be available on http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access the application at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to continue"