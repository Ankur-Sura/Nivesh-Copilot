#!/bin/bash

# =============================================================================
# NIVESH COPILOT - STARTUP SCRIPT
# =============================================================================
# This script starts all services required for the Nivesh Copilot platform

echo "🚀 Starting Nivesh Copilot Platform..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please update .env with your API keys before continuing!${NC}"
    echo ""
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Check MongoDB
echo "📦 Checking MongoDB..."
if ! check_port 27017; then
    echo -e "${YELLOW}⚠️  MongoDB not running on port 27017${NC}"
    echo "   Starting MongoDB (if installed via Homebrew)..."
    brew services start mongodb-community 2>/dev/null || echo "   Please start MongoDB manually"
else
    echo -e "${GREEN}✅ MongoDB is running${NC}"
fi
echo ""

# Check Qdrant
echo "📦 Checking Qdrant Vector DB..."
if ! check_port 6333; then
    echo -e "${YELLOW}⚠️  Qdrant not running on port 6333${NC}"
    echo "   Starting Qdrant via Docker..."
    docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant 2>/dev/null || echo "   Please start Qdrant manually: docker run -p 6333:6333 qdrant/qdrant"
else
    echo -e "${GREEN}✅ Qdrant is running${NC}"
fi
echo ""

# Start AI Service (FastAPI)
echo "🤖 Starting AI Service (FastAPI on port 8000)..."
if check_port 8000; then
    echo -e "${YELLOW}⚠️  Port 8000 already in use. Skipping AI service.${NC}"
else
    cd AI
    if [ ! -d "venv" ]; then
        echo "   Creating Python virtual environment..."
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -q -r requirements.txt 2>/dev/null || echo "   Installing dependencies..."
    echo "   Starting FastAPI server..."
    python main.py > ../logs/ai-service.log 2>&1 &
    AI_PID=$!
    echo $AI_PID > ../logs/ai-service.pid
    echo -e "${GREEN}✅ AI Service started (PID: $AI_PID)${NC}"
    cd ..
    sleep 3
fi
echo ""

# Start Backend (Node.js)
echo "🔧 Starting Backend (Node.js on port 3002)..."
if check_port 3002; then
    echo -e "${YELLOW}⚠️  Port 3002 already in use. Skipping backend.${NC}"
else
    cd backend
    if [ ! -d "node_modules" ]; then
        echo "   Installing dependencies..."
        npm install
    fi
    echo "   Starting Express server..."
    npm start > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
    cd ..
    sleep 2
fi
echo ""

# Start Dashboard (React)
echo "🎨 Starting Dashboard (React on port 3000)..."
if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 already in use. Skipping dashboard.${NC}"
else
    cd dashboard
    if [ ! -d "node_modules" ]; then
        echo "   Installing dependencies..."
        npm install
    fi
    echo "   Starting React app..."
    npm start > ../logs/dashboard.log 2>&1 &
    DASHBOARD_PID=$!
    echo $DASHBOARD_PID > ../logs/dashboard.pid
    echo -e "${GREEN}✅ Dashboard started (PID: $DASHBOARD_PID)${NC}"
    cd ..
fi
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

echo "=============================================================================="
echo -e "${GREEN}✅ All services started!${NC}"
echo "=============================================================================="
echo ""
echo "📍 Services:"
echo "   - AI Service:    http://localhost:8000"
echo "   - Backend API:  http://localhost:3002"
echo "   - Dashboard:    http://localhost:3000"
echo ""
echo "📝 Logs are in the 'logs' directory"
echo ""
echo "🛑 To stop all services, run: ./stop.sh"
echo ""

