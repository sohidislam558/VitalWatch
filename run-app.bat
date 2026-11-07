@echo off
echo ========================================================
echo         Starting VitalWatch Hospital System
echo ========================================================
echo.

echo Starting Laravel Backend API on http://localhost:8000 ...
start "VitalWatch Backend API (Port 8000)" cmd /k "cd /d %~dp0backend && php artisan serve --port=8000"

echo Starting React Frontend on http://localhost:5173 ...
start "VitalWatch Frontend UI (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are launching!
echo - Hospital Application & Landing: http://127.0.0.1:8000
echo - Frontend Dev Server:          http://localhost:5173
echo - Default Seeded Admin:         admin@vitalwatch.hospital / password
echo.
pause

