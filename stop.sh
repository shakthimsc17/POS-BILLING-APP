#!/bin/bash

# POS Billing App - Stop Script
# This script stops all running backend and frontend processes

echo "🛑 Stopping POS Billing App..."

# Kill Node processes running on ports 3001 and 5173
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Alternative method using pkill
pkill -f "tsx watch src/index.ts" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "✅ Application stopped!"

