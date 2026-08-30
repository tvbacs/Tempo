@echo off
title Tempo Music Server Engine
echo ========================================================
echo        STARTING TEMPO BACKEND & CLOUDFLARE TUNNEL
echo ========================================================
cd /d "%~dp0BE\Tempo"

echo [0/2] Freeing port 5050 if occupied...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5050 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo [1/2] Starting Node.js Backend Server on port 5050...
start "Tempo Backend Server" cmd /k "node src/index.js"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Cloudflare Global Tunnel with Auto-Sync...
start "Tempo Cloudflare Tunnel" cmd /k "node tunnel-sync.js"

echo ========================================================
echo    ALL SERVICES STARTED!
echo ========================================================
