@echo off
REM POS Billing App - One-Click Start Script for Windows
REM This script starts both backend and frontend servers

echo.
echo ========================================
echo   POS Billing App - Starting...
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

REM Check if backend .env exists
if not exist "backend\.env" (
    echo [INFO] Creating backend .env file...
    if exist "backend\.env.example" (
        copy backend\.env.example backend\.env >nul
        echo [OK] Created backend\.env from .env.example
    ) else (
        (
            echo DATABASE_URL="postgresql://posbilling:posbilling123@localhost:5432/posbilling_db?schema=public"
            echo JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-12345"
            echo PORT=3001
        ) > backend\.env
        echo [OK] Created backend\.env with default values
    )
)

REM Check if frontend .env exists
if not exist "frontend\.env" (
    echo [INFO] Creating frontend .env file...
    echo VITE_API_BASE_URL=http://localhost:3001/api > frontend\.env
    echo [OK] Created frontend\.env
)

REM Check if node_modules exist
if not exist "backend\node_modules" (
    echo [INFO] Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

REM Check if Prisma client is generated
if not exist "backend\node_modules\.prisma" (
    echo [INFO] Generating Prisma client...
    cd backend
    call npm run prisma:generate
    cd ..
)

echo.
echo ========================================
echo   Starting Servers...
echo ========================================
echo.

REM Start backend in new window
echo [INFO] Starting backend server...
start "POS Backend" cmd /k "cd backend && npm run dev"

REM Wait a bit
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo [INFO] Starting frontend server...
start "POS Frontend" cmd /k "cd frontend && npm run dev"

REM Wait a bit
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Application Started!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
echo.
echo Default Admin Login:
echo   Email:    admin@posbilling.com
echo   Password: admin123
echo.
echo Two new windows have opened for backend and frontend.
echo Close those windows to stop the application.
echo.
pause

