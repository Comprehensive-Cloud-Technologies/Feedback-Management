@echo off
REM Database Setup Helper for Windows
REM This script creates the canteen_feedback database and tables

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  Canteen Feedback System - Database Setup             ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Check if MySQL is in PATH
where mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ MySQL is not in system PATH
    echo Please add MySQL bin directory to PATH or run:
    echo SET PATH=C:\Program Files\MySQL\MySQL Server 8.x\bin;%%PATH%%
    exit /b 1
)

echo Step 1: Checking MySQL connection...
mysql -u root -e "SELECT 1" >nul 2>&1
if %errorlevel% neq 0 (
    echo Attempting with alternative connection method...
    REM Try with no password or check if service is running
)

echo Step 2: Creating database and tables...
mysql -u root < "%~dp0setup-db.sql" >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Failed to create database
    echo Please check:
    echo  - MySQL is running
    echo  - Your MySQL root password (if set)
    echo  - Run manually: mysql -u root -p ^< setup-db.sql
    exit /b 1
)

echo ✓ Database setup complete!
echo.
echo Database: canteen_feedback
echo User: feedback_user
echo Password: feedback123
echo.
echo You can now start the application.
