#!/bin/bash

# POS Billing App - One-Click Start Script
# This script starts both backend and frontend servers

echo "🚀 Starting POS Billing App..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    exit 1
fi

# Check if Docker is running (if using Docker)
if command -v docker &> /dev/null; then
    if ! docker ps &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker is not running. Starting database...${NC}"
        docker-compose up -d
        echo "Waiting for database to be ready..."
        sleep 5
    else
        # Check if database container is running
        if ! docker ps | grep -q posbilling_postgres; then
            echo -e "${YELLOW}⚠️  Database container not running. Starting...${NC}"
            docker-compose up -d
            echo "Waiting for database to be ready..."
            sleep 5
        fi
    fi
fi

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Backend .env file not found. Creating default...${NC}"
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✅ Created backend/.env from .env.example${NC}"
    else
        cat > backend/.env << EOF
DATABASE_URL="postgresql://posbilling:posbilling123@localhost:5432/posbilling_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-12345"
PORT=3001
EOF
        echo -e "${GREEN}✅ Created backend/.env with default values${NC}"
    fi
fi

# Check if frontend .env exists
if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  Frontend .env file not found. Creating default...${NC}"
    echo "VITE_API_BASE_URL=http://localhost:3001/api" > frontend/.env
    echo -e "${GREEN}✅ Created frontend/.env${NC}"
fi

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not installed. Installing...${NC}"
    cd backend
    npm install
    cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not installed. Installing...${NC}"
    cd frontend
    npm install
    cd ..
fi

# Check if Prisma client is generated
if [ ! -d "backend/node_modules/.prisma" ]; then
    echo -e "${YELLOW}⚠️  Prisma client not generated. Generating...${NC}"
    cd backend
    npm run prisma:generate
    cd ..
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${GREEN}📦 Starting backend server...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo -e "${GREEN}🌐 Starting frontend server...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a bit for frontend to start
sleep 3

echo ""
echo -e "${GREEN}✅ Application started successfully!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 POS Billing App is running!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend API: http://localhost:3001"
echo ""
echo "👤 Default Admin Login:"
echo "   Email: admin@posbilling.com"
echo "   Password: admin123"
echo ""
echo "📝 Logs:"
echo "   Backend: backend.log"
echo "   Frontend: frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the application${NC}"
echo ""

# Wait for user interrupt
wait

