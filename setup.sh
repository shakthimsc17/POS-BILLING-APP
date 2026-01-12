#!/bin/bash

echo "🚀 Setting up POS Billing App - Local PostgreSQL Version"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Start PostgreSQL
echo "📦 Starting PostgreSQL container..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Setup Backend
echo ""
echo "🔧 Setting up backend..."
cd backend

if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
fi

echo "📦 Installing backend dependencies..."
npm install

echo "🔨 Generating Prisma client..."
npm run prisma:generate

echo "🗄️  Pushing database schema..."
npm run prisma:push

cd ..

# Setup Frontend
echo ""
echo "🔧 Setting up frontend..."
cd frontend

if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    echo "VITE_API_BASE_URL=http://localhost:3001/api" > .env
fi

echo "📦 Installing frontend dependencies..."
npm install

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  1. Start backend:  cd backend && npm run dev"
echo "  2. Start frontend: cd frontend && npm run dev"
echo ""
echo "Backend will run on: http://localhost:3001"
echo "Frontend will run on: http://localhost:5173"
echo ""

