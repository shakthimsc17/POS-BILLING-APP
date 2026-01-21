@echo off
REM POS Billing App - Stop Script for Windows

echo.
echo ========================================
echo   Stopping POS Billing App...
echo ========================================
echo.

REM Kill processes on ports 3001 and 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill Node processes
taskkill /F /IM node.exe >nul 2>&1

echo [OK] Application stopped!
echo.
pause

