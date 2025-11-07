@echo off
echo ========================================
echo   INSTALADOR AUTOMATICO - SISTEMA MUNICIPAL
echo ========================================
echo.

echo [1/4] Instalando dependencias del Backend...
cd backend
if not exist venv (
    echo Creando entorno virtual...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt
echo.

echo [2/4] Ejecutando migraciones...
python ejecutar_migracion.py
echo.

echo [3/4] Instalando dependencias del Frontend...
cd ..\frontend
call npm install
echo.

echo [4/4] Configuracion completa!
echo.
echo ========================================
echo   INSTALACION COMPLETADA
echo ========================================
echo.
echo Para iniciar el sistema ejecuta:
echo   - Backend:  cd backend ^&^& venv\Scripts\activate ^&^& python app.py
echo   - Frontend: cd frontend ^&^& npm run dev
echo.
echo Luego abre: http://localhost:3000
echo.
pause
