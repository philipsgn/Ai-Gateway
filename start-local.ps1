# Enterprise AI Access Management - Local Starter (PowerShell)
# Track A — Real MVP Vertical Slice

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   ENTERPRISE AI ACCESS MANAGEMENT SYSTEM — TRACK A (REAL MVP)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Clean up old process on port 3000
Write-Host "[1/3] Don dep tien trinh cu tren cong 3000..." -ForegroundColor Yellow
$p3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($p3000) {
    foreach ($pidToKill in $p3000) {
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
    }
}

# 2. Check environment configuration
Write-Host "[2/3] Kiem tra cau hinh bien moi truong..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️ CHUA TIM THAY .env.local! Tao ban sao tu .env.example..." -ForegroundColor Red
    Copy-Item ".env.example" ".env.local"
    Write-Host "Vui long dien cac gia tri thuc te vao .env.local (DATABASE_URL, GOOGLE_CLIENT_ID, v.v.)" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ Da tim thay .env.local" -ForegroundColor Green
}

# 3. Start Next.js App Router (Port 3000)
Write-Host "`n[3/3] Dang khoi dong Next.js 14 App Router (Port 3000)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "   HE THONG TRACK A DANG KHOI CHAY TREN http://localhost:3000" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host " * NextAuth v5 Google OAuth:  http://localhost:3000" -ForegroundColor White
Write-Host " * PostgreSQL Audit Logs:     http://localhost:3000/audit" -ForegroundColor White
Write-Host " * Redis Health Check:        http://localhost:3000/api/health/redis" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""

npm run dev
