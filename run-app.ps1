Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "         Starting VitalWatch Hospital System" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "Starting Laravel Backend API on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; php artisan serve --port=8000"

Write-Host "Starting React Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Write-Host ""
Write-Host "Both servers launched successfully!" -ForegroundColor Yellow
Write-Host "Hospital Application & Landing: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "Frontend Dev Server:          http://localhost:5173" -ForegroundColor White
Write-Host "Default Seeded Admin:         admin@vitalwatch.hospital / password" -ForegroundColor Green


