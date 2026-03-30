@echo off
REM ===================================================================
REM  Canteen Feedback System - Local Development Server Startup Script
REM ===================================================================
REM This script starts both PHP backend and React frontend servers
REM for local development of the Canteen Feedback System

setlocal enabledelayedexpansion

REM Get the directory where this script is located
cd /d "%~dp0"

echo.
echo ===================================================
echo Canteen Feedback System - Development Server Startup
echo ===================================================
echo.

REM Kill any existing processes on ports 8000 and 5173
echo Cleaning up old processes...
taskkill /F /IM php.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

REM Start PHP Backend Server
echo.
echo [1/2] Starting PHP Backend Server on http://192.168.1.100:8000/api
echo.
start /B "PHP Backend Server" cmd /c "cd /d "%~dp0cfs-backend-php" && D:\php\php.exe -c php-dev.ini -S 0.0.0.0:8000"
timeout /t 2 /nobreak >nul

REM Verify PHP server is running
echo Verifying PHP server...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest 'http://192.168.1.100:8000/api/sites' -UseBasicParsing -ErrorAction Stop; if ($r.StatusCode -eq 200) { Write-Host '✓ PHP Backend Server is running and responding on network' -ForegroundColor Green } } catch { Write-Host '✗ PHP Backend Server not responding' -ForegroundColor Red }"

echo.
echo [2/2] Starting React Frontend Server on http://localhost:5173
echo.
start "React Frontend Server" cmd /c "cd /d "%~dp0cfs-frontend" && npm run dev"

echo.
echo ===================================================
echo ✓ Both servers are starting!
echo ===================================================
echo.
echo Frontend: http://localhost:5173/
echo Frontend (Network): http://192.168.1.100:5173/
echo Backend API: http://localhost:8000/api
echo.
echo Default Admin Credentials:
echo  - Username: admin
echo  - Password: SuperAdmin@2835
echo.
echo Press Ctrl+C in either window to stop that server
echo ===================================================
echo.

endlocal
