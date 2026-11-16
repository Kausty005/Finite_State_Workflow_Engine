@echo off
echo ===================================================
echo   FlowState - Finite State Workflow Automation Engine
echo ===================================================
echo.
echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "FlowState Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo Starting Vite Frontend on http://localhost:5173 ...
start "FlowState Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo FlowState is running!
echo Access the Web UI: http://localhost:5173
echo API Documentation: http://127.0.0.1:8000/docs
echo ===================================================
pause

