#!/bin/bash

echo "🚀 Setting up POS Billing App - Local PostgreSQL Version"
echo ""
echo "⚠️  This script assumes PostgreSQL is already installed and running locally."
echo "   If you haven't set up PostgreSQL yet, please see INSTALLATION_GUIDE.md"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

# Check if PostgreSQL is accessible
if ! command -v psql &> /dev/null; then
    echo "⚠️  psql command not found. Make sure PostgreSQL is installed and in your PATH."
    echo "   Continuing with setup, but you may need to set up the database manually."
fi

# Setup Backend
echo ""
echo "🔧 Setting up backend..."
cd backend

if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
    else
        cat > .env << EOF
DATABASE_URL="postgresql://posbilling:posbilling123@localhost:5432/posbilling_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-12345"
PORT=3001
EOF
        echo "✅ Created .env with default values"
    fi
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
    echo "✅ Created frontend/.env"
fi

echo "📦 Installing frontend dependencies..."
npm install

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "⚠️  Make sure PostgreSQL is running and the database is set up."
echo "   See INSTALLATION_GUIDE.md for database setup instructions."
echo ""
echo "To start the application:"
echo "  1. Start backend:  cd backend && npm run dev"
echo "  2. Start frontend: cd frontend && npm run dev"
echo ""
echo "Or use the start script: ./start.sh"
echo ""
echo "Backend will run on: http://localhost:3001"
echo "Frontend will run on: http://localhost:5173"
echo ""
