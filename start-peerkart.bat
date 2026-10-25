@echo off
cd /d "%~dp0server"
start "PeerKart Backend" cmd /k npm run dev
cd /d "%~dp0client"
start "PeerKart Website" cmd /k npm run dev
timeout /t 8 >nul
start http://localhost:5173