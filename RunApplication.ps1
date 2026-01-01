# PowerShell script to run the SPC Analysis Tool with both backend and frontend

Write-Host "Starting QIP Data Analysis Tool..." -ForegroundColor Green
Write-Host "Initializing backend server..." -ForegroundColor Yellow

# Get the current directory
$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start the backend server
$BackendDir = Join-Path $BaseDir "backend"
Set-Location $BackendDir
$backendProcess = Start-Process -FilePath "python" -ArgumentList "main.py" -PassThru

Write-Host "Initializing frontend server..." -ForegroundColor Yellow

# Start the frontend server
$FrontendDir = Join-Path $BaseDir "frontend"
Set-Location $FrontendDir
$frontendProcess = Start-Process -FilePath "npx" -ArgumentList "vite" -PassThru

Write-Host ""
Write-Host "QIP Data Analysis Tool is starting..." -ForegroundColor Green
Write-Host "Backend server: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend server: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Application will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C in this window to stop the application" -ForegroundColor Yellow
Write-Host ""

# Wait for user input to stop the application
try {
    $input = Read-Host "Press Enter to stop the application"
} 
finally {
    Write-Host "Shutting down QIP Data Analysis Tool..." -ForegroundColor Red
    
    # Stop the processes
    if ($backendProcess -and !$backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force
    }
    if ($frontendProcess -and !$frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force
    }
    
    Write-Host "Application stopped." -ForegroundColor Green
}