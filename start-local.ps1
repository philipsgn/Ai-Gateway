# Enterprise AI Access Management - Local Starter (PowerShell)
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   ENTERPRISE AI ACCOUNT & ACCESS MANAGEMENT SYSTEM (PHASE 5 & 6)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Don dep tien trinh cu tren cong 3000 va 4000..." -ForegroundColor Yellow
$p3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($p3000) {
    foreach ($pidToKill in $p3000) {
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
    }
}
$p4000 = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($p4000) {
    foreach ($pidToKill in $p4000) {
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "[2/4] Xoa cache cu apps/web/.next..." -ForegroundColor Yellow
if (Test-Path "apps\web\.next") {
    Remove-Item -Recurse -Force "apps\web\.next" -ErrorAction SilentlyContinue
}

Write-Host "[3/4] Build dist cac package dung chung..." -ForegroundColor Yellow
npm run build --workspace=packages/shared --workspace=packages/security --workspace=packages/config

Write-Host "`n[4/4] Dang khoi dong Backend API & WebSocket Hub (Port 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:api"

Write-Host "Dang khoi dong Next.js Web Console (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:web"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "   HE THONG DA DUOC KHOI CHAY THANH CONG!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host " * Web Console:       http://localhost:3000" -ForegroundColor White
Write-Host " * Backend API:       http://localhost:4000" -ForegroundColor White
Write-Host " * WebSocket Stream:  ws://localhost:4000/admin/live-monitor" -ForegroundColor White
Write-Host ""
Write-Host " * Chrome Extension:  apps\extension (Load unpacked tai chrome://extensions)" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"
