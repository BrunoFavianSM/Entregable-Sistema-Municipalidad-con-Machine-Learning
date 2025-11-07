@echo off
echo ========================================
echo   INICIANDO SISTEMA MUNICIPAL
echo ========================================
echo.

echo [1/2] Iniciando Backend...
start cmd /k "cd backend && venv\Scripts\activate && python app.py"

timeout /t 3 /nobreak >nul

echo [2/2] Iniciando Frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   SISTEMA INICIADO
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Presiona cualquier tecla para salir...
pause >nul
