# 🤖 Nivesh Copilot AI Service

## 📚 What is this?

This is the **AI Backend Service** for Nivesh Copilot. It's a FastAPI server that provides AI capabilities for stock research and analysis.

## 🔗 How it Connects

```
Frontend (React - port 3000)
         ↓
Backend (Node.js/Express - port 3002)
         ↓
AI Service (FastAPI/Python - port 8000)  ← THIS IS HERE!
```

## 📁 File Structure

```
AI/
├── main.py           # 🚀 Server entry point
├── agent_service.py  # 🤖 AI Agent with stock research workflow
├── stock_graph.py    # 📈 LangGraph 7-node stock research pipeline
├── tools_service.py  # 🛠️ STT, Search, Stock price tools
├── requirements.txt  # 📦 Python dependencies
└── README.md         # 📖 This file
```

## 🚀 How to Run

### Step 1: Install Dependencies

```bash
cd AI
pip install -r requirements.txt
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the AI folder:

```env
OPENAI_API_KEY=sk-your-key-here

# Optional for better web search:
TAVILY_API_KEY=your-tavily-key
EXA_API_KEY=your-exa-key

# Optional for persistent memory:
REDIS_URL=redis://localhost:6379/0
MONGO_URL=mongodb://localhost:27017
```

### Step 3: Run the Server

```bash
# Simple run:
python main.py

# Or with auto-reload (for development):
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Verify it's Running

Visit: http://localhost:8000/docs

You'll see the auto-generated API documentation!

---

## 📖 API Endpoints

### Health Check
```
GET /health
→ { "status": "ok" }
```

### Stock Research (7-Node LangGraph Workflow)
```
POST /agent/stock-research
→ Comprehensive stock analysis with:
  1. Company Introduction
  2. Sector Analysis
  3. Company Research (MoneyControl, Screener, ET)
  4. Policy Analysis
  5. Investor Sentiment
  6. Technical Analysis (RSI, Moving Averages, Risk Warnings)
  7. Investment Suggestion
```

### Smart Chat
```
POST /agent/smart-chat   ← General AI chat with web search
```

### Order Detection
```
POST /agent/detect-order ← Detect buy/sell orders from text/voice
```

### Stock Prices
```
GET  /tools/market-indices     ← Nifty 50 & Sensex prices
POST /tools/stock-prices       ← Multiple stock prices
GET  /tools/stock-price/{sym}  ← Single stock price
```

### Voice (Speech-to-Text)
```
POST /stt/transcribe  ← Convert audio to text (Whisper)
```

### Search Tools
```
GET  /tools/indian-stock-search  ← Search trusted Indian financial sites
GET  /tools/web-search           ← General web search
```

---

## 🎯 Key Features

### 1. LangGraph Stock Research Pipeline
A 7-node workflow that provides comprehensive stock analysis:
- **Company Intro**: What the company does, sectors, locations
- **Sector Analysis**: Industry trends and outlook
- **Company Research**: Financials from MoneyControl, Screener, ET
- **Policy Watchdog**: Government policies impact
- **Investor Sentiment**: Market sentiment & analyst ratings
- **Technical Analysis**: RSI, Moving Averages, Support/Resistance, RISK WARNINGS
- **Investment Suggestion**: Buy/Sell/Hold recommendation

### 2. Smart Routing
Automatically detects if query is about:
- Specific company → Runs 7-node company workflow
- General sector → Runs 4-node sector workflow

### 3. Indian Stock Search
Specialized search that only queries trusted sources:
- MoneyControl
- Screener.in
- Economic Times
- LiveMint

### 4. Voice Commands
- Speech-to-text using OpenAI Whisper
- Order detection for voice trading commands

### 5. Real-time Prices
- Yahoo Finance integration for live stock prices
- Nifty 50 & Sensex indices

---

## 🔄 System Requirements

### Required
- Python 3.9+
- OpenAI API Key

### Optional (for full functionality)
- **Redis** (for persistent memory):
  ```bash
  docker run -p 6379:6379 redis
  ```

- **MongoDB** (for order storage):
  ```bash
  docker run -p 27017:27017 mongo
  ```

---

## 💡 Interview Talking Points

### "How does your AI service work?"

> "I built a FastAPI backend that provides AI capabilities. It has:
> 1. **Stock Research** - A LangGraph 7-node workflow for comprehensive stock analysis
> 2. **Smart Routing** - Detects query type and routes to appropriate workflow
> 3. **Voice Commands** - Speech-to-text with Whisper for voice trading
> 4. **Real-time Data** - Yahoo Finance integration for live prices"

### "Explain the Stock Research Workflow"

> "I use LangGraph to orchestrate a 7-node research pipeline:
> 1. Company Intro - Understand the business
> 2. Sector Analysis - Industry outlook
> 3. Company Research - Financials from trusted sources (MoneyControl, Screener)
> 4. Policy Analysis - Government impact
> 5. Investor Sentiment - Market mood
> 6. Technical Analysis - RSI, MAs, Risk Warnings
> 7. Investment Suggestion - Final recommendation
> 
> Each node builds on the previous, ensuring thorough analysis."

### "What's an AI Agent?"

> "An AI Agent follows a plan-action-observe-output pattern:
> 1. **Plan** - Thinks about what to do
> 2. **Action** - Calls a tool (like web search)
> 3. **Observe** - Sees the results
> 4. **Output** - Gives final answer
> 
> It can take actions in the real world, not just respond to text."

### "Why FastAPI?"

> "FastAPI is a modern Python web framework with:
> - Automatic API documentation (/docs)
> - Built-in data validation with Pydantic
> - Async support for handling many requests
> - Easy integration with AI/ML libraries"

---

## 🐛 Troubleshooting

### "ModuleNotFoundError"
```bash
pip install -r requirements.txt
```

### "OpenAI API Error"
Check your `.env` file has a valid `OPENAI_API_KEY`

### "Stock price showing N/A"
- Ensure the stock symbol is correct
- Yahoo Finance may have rate limits - wait a few seconds

---

Made with ❤️ for Nivesh Copilot
