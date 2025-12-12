# 🚀 Nivesh Copilot - AI-Powered Stock Trading Platform

A Zerodha-style stock trading platform enhanced with an intelligent AI Copilot for research, insights, and safe voice-assisted trade drafting.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Broker API Integration](#broker-api-integration)

## ✨ Features

### 🤖 AI Copilot
- **7-Step Stock Analysis Pipeline**: Company → Sector → Financials → Policies → Sentiment → Technicals → Risk
- **Voice Input**: Speak your queries using Web Speech API
- **Smart Routing**: Automatically detects company vs sector queries
- **Risk Sentinel**: Real-time alerts for overbought stocks, negative news, and speculative zones
- **RAG (Retrieval Augmented Generation)**: Upload PDFs and ask questions

### 📊 Trading Dashboard
- Holdings, Positions, and Orders management
- Real-time portfolio tracking
- Watchlist with charts
- Order placement interface

### 🔍 Research Capabilities
- Comprehensive stock analysis with 7-step workflow
- Sector-level analysis
- Technical indicators (RSI, P/E, Moving Averages)
- Policy impact analysis
- Investor sentiment tracking

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  React Dashboard (Port 3000)
│   (Dashboard)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │  Node.js/Express (Port 3002)
│   (API Proxy)   │  MongoDB for data storage
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   AI Service     │  FastAPI/Python (Port 8000)
│   (LangGraph)   │  - Stock Research Workflow
│                 │  - RAG Service
│                 │  - Agent Service
│                 │  - Tools (STT, OCR, Search)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Qdrant        │  Vector Database (Port 6333)
│   (Vector DB)   │  For PDF embeddings
└─────────────────┘
```

## 📦 Prerequisites

- **Node.js** (v16+)
- **Python** (v3.9+)
- **MongoDB** (running on port 27017)
- **Docker** (for Qdrant, optional - can use cloud)
- **OpenAI API Key** (required for AI features)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Nivesh Copilot"
```

### 2. Set Up Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or use your preferred editor
```

**Required variables:**
```env
OPENAI_API_KEY=sk-your-key-here
MONGO_URL=mongodb://localhost:27017/nivesh_copilot
AI_SERVICE_URL=http://localhost:8000
```

### 3. Install Dependencies

#### Backend
```bash
cd backend
npm install
cd ..
```

#### Dashboard
```bash
cd dashboard
npm install
cd ..
```

#### AI Service
```bash
cd AI
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 4. Start Required Services

#### MongoDB
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Or manually
mongod
```

#### Qdrant (Vector Database)
```bash
# Using Docker
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant

# Or use Qdrant Cloud (no local setup needed)
```

## 🎯 Running the Project

### Option 1: Automated Startup (Recommended)

```bash
# Make scripts executable (first time only)
chmod +x start.sh stop.sh

# Start all services
./start.sh

# Stop all services
./stop.sh
```

### Option 2: Manual Startup

#### Terminal 1: AI Service
```bash
cd AI
source venv/bin/activate
python main.py
# Service runs on http://localhost:8000
```

#### Terminal 2: Backend
```bash
cd backend
npm start
# Backend runs on http://localhost:3002
```

#### Terminal 3: Dashboard
```bash
cd dashboard
npm start
# Dashboard opens on http://localhost:3000
```

## 📡 API Endpoints

### Backend Endpoints (Port 3002)

#### Trading
- `GET /allHoldings` - Get all holdings
- `GET /allPositions` - Get all positions
- `POST /newOrder` - Place new order

#### AI Service Proxy
- `GET /ai/health` - Check AI service status
- `POST /ai/stock-research` - 7-step stock analysis
- `POST /ai/chat` - General AI chat
- `POST /ai/transcribe` - Speech-to-text
- `POST /ai/pdf/upload` - Upload PDF for RAG
- `POST /ai/pdf/query` - Query uploaded PDF

### AI Service Endpoints (Port 8000)

See [AI/README.md](AI/README.md) for full documentation.

## 📁 Project Structure

```
Nivesh Copilot/
├── AI/                      # FastAPI AI Service
│   ├── main.py             # FastAPI server entry
│   ├── agent_service.py    # AI Agent with tools
│   ├── rag_service.py      # RAG for PDF Q&A
│   ├── stock_graph.py      # 7-step LangGraph workflow
│   ├── tools_service.py    # STT, OCR, Search tools
│   └── requirements.txt    # Python dependencies
│
├── backend/                 # Node.js Backend
│   ├── index.js           # Express server + AI proxy
│   ├── model/             # MongoDB models
│   │   ├── HoldingsModel.js
│   │   ├── PositionsModel.js
│   │   └── OrdersModel.js
│   └── package.json
│
├── dashboard/              # React Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── AICopilot.js    # AI Chat Interface
│   │   │   ├── Dashboard.js
│   │   │   ├── Holdings.js
│   │   │   └── ...
│   │   └── index.js
│   └── package.json
│
├── frontend/               # Landing Page (React)
│   └── ...
│
├── .env.example           # Environment variables template
├── start.sh               # Startup script
├── stop.sh                # Stop script
└── README.md              # This file
```

## 🔌 Broker API Integration

### Do You Need Broker APIs?

**For MVP/Demo: NO** ❌

The current implementation works perfectly without broker APIs:
- ✅ Stock analysis and research
- ✅ Portfolio tracking (mock data)
- ✅ AI-powered insights
- ✅ Voice-driven queries

**For Production: YES** ✅

To enable real trading, you'll need to integrate:

#### Zerodha Kite Connect
```javascript
// Future integration point in backend/index.js
// const KiteConnect = require('kiteconnect');

// app.post('/api/zerodha/place-order', async (req, res) => {
//   // Zerodha order placement logic
// });
```

#### AngelOne SmartAPI
```javascript
// Future integration point
// const SmartAPI = require('smartapi-javascript');

// app.post('/api/angelone/place-order', async (req, res) => {
//   // AngelOne order placement logic
// });
```

**Integration Steps (Future):**
1. Get API credentials from broker
2. Add authentication flow
3. Implement order placement endpoints
4. Add real-time market data feed
5. Update frontend to use real APIs

**Current Status:** Platform is ready for broker integration. All infrastructure is in place - just need to add broker-specific SDKs and authentication.

## 🧪 Testing

### Test AI Service
```bash
# Health check
curl http://localhost:8000/health

# Stock research
curl -X POST http://localhost:3002/ai/stock-research \
  -H "Content-Type: application/json" \
  -d '{"query": "Tell me about Tata Motors stock"}'
```

### Test Backend
```bash
# Get holdings
curl http://localhost:3002/allHoldings
```

## 🐛 Troubleshooting

### AI Service Not Responding
- Check if port 8000 is available: `lsof -i :8000`
- Verify OpenAI API key in `.env`
- Check AI service logs: `tail -f logs/ai-service.log`

### Backend Connection Issues
- Verify MongoDB is running: `mongosh`
- Check backend logs: `tail -f logs/backend.log`

### Dashboard Not Loading
- Clear browser cache
- Check console for errors
- Verify backend is running on port 3002

### Voice Input Not Working
- Allow microphone access in browser
- Use HTTPS in production (required for microphone)
- Check browser console for errors

## 📝 Development Notes

### Adding New Features

1. **New AI Tool**: Add to `AI/tools_service.py`
2. **New Backend Route**: Add to `backend/index.js`
3. **New Dashboard Component**: Add to `dashboard/src/components/`

### Environment Variables

All sensitive data should be in `.env` file (not committed to git).

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📄 License

Private project - All rights reserved.

## 🎓 Key Technologies

- **Frontend**: React, Material-UI, Chart.js
- **Backend**: Node.js, Express, MongoDB
- **AI Service**: FastAPI, LangGraph, OpenAI, LangChain
- **Vector DB**: Qdrant
- **Voice**: Web Speech API + OpenAI Whisper

---

**Built with ❤️ for intelligent stock trading**

