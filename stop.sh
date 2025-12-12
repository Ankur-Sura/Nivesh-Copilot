#!/bin/bash

# =============================================================================
# NIVESH COPILOT - STOP SCRIPT
# =============================================================================

echo "🛑 Stopping Nivesh Copilot Platform..."
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop AI Service
if [ -f logs/ai-service.pid ]; then
    AI_PID=$(cat logs/ai-service.pid)
    if kill -0 $AI_PID 2>/dev/null; then
        kill $AI_PID
        echo -e "${GREEN}✅ Stopped AI Service (PID: $AI_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  AI Service not running${NC}"
    fi
    rm logs/ai-service.pid
else
    echo -e "${YELLOW}⚠️  AI Service PID file not found${NC}"
fi

# Stop Backend
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo -e "${GREEN}✅ Stopped Backend (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend not running${NC}"
    fi
    rm logs/backend.pid
else
    echo -e "${YELLOW}⚠️  Backend PID file not found${NC}"
fi

# Stop Dashboard
if [ -f logs/dashboard.pid ]; then
    DASHBOARD_PID=$(cat logs/dashboard.pid)
    if kill -0 $DASHBOARD_PID 2>/dev/null; then
        kill $DASHBOARD_PID
        echo -e "${GREEN}✅ Stopped Dashboard (PID: $DASHBOARD_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Dashboard not running${NC}"
    fi
    rm logs/dashboard.pid
else
    echo -e "${YELLOW}⚠️  Dashboard PID file not found${NC}"
fi

echo ""
echo "✅ All services stopped!"

