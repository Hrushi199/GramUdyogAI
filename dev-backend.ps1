# PowerShell script to start FastAPI backend with hot reload
Write-Host "🚀 Starting FastAPI Backend with Hot Reload..." -ForegroundColor Green
Write-Host ""

# Change to backend directory
Set-Location backend

# Start the development server
python dev_server.py

# Keep the window open if there's an error
Read-Host "Press Enter to exit" 