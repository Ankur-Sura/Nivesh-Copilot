#!/bin/bash

# =============================================================================
# .gitignore Test Script
# =============================================================================
# Tests that .gitignore patterns work correctly
# Run this before committing to catch mistakes early

echo "🧪 Testing .gitignore patterns..."
echo ""

ERRORS=0
WARNINGS=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =============================================================================
# Test 1: .env.example should be tracked (NOT ignored)
# =============================================================================
echo "Test 1: .env.example should be tracked..."
if git check-ignore -v .env.example >/dev/null 2>&1; then
    echo -e "${RED}❌ FAIL: .env.example is ignored!${NC}"
    echo "   Fix: Add '!.env.example' after '*.env' in .gitignore"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: .env.example will be tracked${NC}"
fi
echo ""

# =============================================================================
# Test 2: Actual .env files should be ignored
# =============================================================================
echo "Test 2: Actual .env files should be ignored..."
if [ -f .env ]; then
    if git check-ignore -v .env >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS: .env is ignored${NC}"
    else
        echo -e "${RED}❌ FAIL: .env is NOT ignored!${NC}"
        echo "   Fix: Add '.env' or '*.env' to .gitignore"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  SKIP: .env file doesn't exist${NC}"
fi
echo ""

# =============================================================================
# Test 3: Check for other template files that might be ignored
# =============================================================================
echo "Test 3: Checking for other template files..."
TEMPLATE_FILES=$(find . -name "*.example" -o -name "*.template" -o -name "*.sample" 2>/dev/null | grep -v node_modules | grep -v venv | grep -v ".venv")

if [ -n "$TEMPLATE_FILES" ]; then
    echo "Found template files:"
    for file in $TEMPLATE_FILES; do
        if git check-ignore -v "$file" >/dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  WARNING: $file is ignored (might need exception)${NC}"
            WARNINGS=$((WARNINGS + 1))
        else
            echo -e "${GREEN}✅ $file will be tracked${NC}"
        fi
    done
else
    echo -e "${GREEN}✅ No template files found${NC}"
fi
echo ""

# =============================================================================
# Test 4: Check for sensitive files that should be ignored
# =============================================================================
echo "Test 4: Checking sensitive files are ignored..."
SENSITIVE_FILES=$(find . -name "*.key" -o -name "*.pem" -o -name "*.cert" 2>/dev/null | grep -v node_modules | grep -v venv | grep -v ".venv" | head -5)

if [ -n "$SENSITIVE_FILES" ]; then
    for file in $SENSITIVE_FILES; do
        if git check-ignore -v "$file" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $file is ignored${NC}"
        else
            echo -e "${RED}❌ FAIL: $file is NOT ignored!${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    echo -e "${GREEN}✅ No sensitive files found${NC}"
fi
echo ""

# =============================================================================
# Test 5: Check node_modules is ignored
# =============================================================================
echo "Test 5: Checking node_modules is ignored..."
if [ -d "node_modules" ] || [ -d "backend/node_modules" ] || [ -d "dashboard/node_modules" ]; then
    TEST_DIR=""
    if [ -d "node_modules" ]; then
        TEST_DIR="node_modules"
    elif [ -d "backend/node_modules" ]; then
        TEST_DIR="backend/node_modules"
    else
        TEST_DIR="dashboard/node_modules"
    fi
    
    if git check-ignore -v "$TEST_DIR" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $TEST_DIR is ignored${NC}"
    else
        echo -e "${RED}❌ FAIL: $TEST_DIR is NOT ignored!${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  SKIP: node_modules not found${NC}"
fi
echo ""

# =============================================================================
# Test 6: Check venv is ignored
# =============================================================================
echo "Test 6: Checking venv is ignored..."
if [ -d "venv" ] || [ -d "AI/venv" ] || [ -d ".venv" ]; then
    TEST_DIR=""
    if [ -d "venv" ]; then
        TEST_DIR="venv"
    elif [ -d "AI/venv" ]; then
        TEST_DIR="AI/venv"
    else
        TEST_DIR=".venv"
    fi
    
    if git check-ignore -v "$TEST_DIR" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $TEST_DIR is ignored${NC}"
    else
        echo -e "${RED}❌ FAIL: $TEST_DIR is NOT ignored!${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  SKIP: venv not found${NC}"
fi
echo ""

# =============================================================================
# Summary
# =============================================================================
echo "=============================================================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Your .gitignore is configured correctly.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Tests passed with $WARNINGS warning(s). Review warnings above.${NC}"
    exit 0
else
    echo -e "${RED}❌ Tests failed with $ERRORS error(s) and $WARNINGS warning(s).${NC}"
    echo "Fix the errors above before committing."
    exit 1
fi

