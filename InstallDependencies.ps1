# PowerShell script to install dependencies for Web-based SPC Analysis Tool

Write-Host "Installing dependencies for Web-based SPC Analysis Tool..." -ForegroundColor Green
Write-Host ""

# Get the current directory
$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
$BackendDir = Join-Path $BaseDir "backend"
Set-Location $BackendDir
pip install -r requirements.txt

Write-Host ""
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
$FrontendDir = Join-Path $BaseDir "frontend"
Set-Location $FrontendDir
npm install

Write-Host ""
Write-Host "Installation completed!" -ForegroundColor Green
Write-Host "You can now run the application using StartApplication.bat or StartApplication.ps1" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to continue"