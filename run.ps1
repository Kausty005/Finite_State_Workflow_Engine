Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  FlowState - Finite State Workflow Automation Engine" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 3

Write-Host "Starting Vite React Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "FlowState is running!" -ForegroundColor Green
Write-Host "Access the Web UI: http://localhost:5173" -ForegroundColor Yellow
Write-Host "API Documentation: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan

