"""
===================================================================================
            STOCK_GRAPH.PY - LangGraph Stock Research Workflow
===================================================================================

📚 WHAT IS THIS FILE?
---------------------
This file implements the SHARE MARKET RESEARCH WORKFLOW using LangGraph.

🔗 THIS IS EXACTLY LIKE YOUR NOTES (07-LangGraph/graph.py)!

YOUR NOTES:
    graph_builder = StateGraph(State)
    graph_builder.add_node("chat_node", chat_node)
    graph_builder.add_edge(START, "chat_node")
    graph_builder.add_edge("chat_node", END)

THIS FILE (7-NODE VERSION WITH RISK SENTINEL!):
    graph_builder = StateGraph(StockResearchState)
    graph_builder.add_node("company_intro", company_intro_node)           
    graph_builder.add_node("sector_analyst", sector_analyst_node)
    graph_builder.add_node("company_researcher", company_researcher_node)
    graph_builder.add_node("policy_watchdog", policy_watchdog_node)
    graph_builder.add_node("investor_sentiment", investor_sentiment_node) 
    graph_builder.add_node("technical_analysis", technical_analysis_node)  # NEW! RISK SENTINEL
    graph_builder.add_node("investment_suggestion", investment_suggestion_node)
    
    Edges: START → company_intro → sector_analyst → company_researcher → 
           policy_watchdog → investor_sentiment → technical_analysis →
           investment_suggestion → END

===================================================================================
                     THE ENHANCED 7-NODE WORKFLOW (WITH RISK SENTINEL!)
===================================================================================

    User: "Tell me about Tata Motors stock"
                    │
                    ▼
    ┌─────────────────────────────────────┐
    │   NODE 1: COMPANY INTRO 🏢          │
    │  "What does this company do?"       │
    │  Overview, activities, locations    │
    └─────────────────┬───────────────────┘
                      │
                      ▼
    ┌─────────────────────────────────────┐
    │   NODE 2: SECTOR ANALYST 🏭         │
    │  "What sector? How's it growing?"   │
    │  Uses intro for accurate sector ID  │
    └─────────────────┬───────────────────┘
                      │
                      ▼
    ┌─────────────────────────────────────┐
    │   NODE 3: COMPANY RESEARCHER 🕵️     │
    │  "Get company financials & news"    │
    │  Tool: indian_stock_search()        │
    │  (MoneyControl, Screener only!)     │
    └─────────────────┬───────────────────┘
                      │
                      ▼
    ┌─────────────────────────────────────┐
    │   NODE 4: POLICY WATCHDOG ⚖️        │
    │  "Any govt policies affecting it?"  │
    │  Tool: search_news("policy...")     │
    └─────────────────┬───────────────────┘
                      │
                      ▼
    ┌─────────────────────────────────────┐
    │   NODE 5: INVESTOR SENTIMENT 📊     │
    │  "What are investors saying?"       │
    │  FII/DII, analyst ratings, buzz     │
    └─────────────────┬───────────────────┘
                      │
                      ▼
    ┌─────────────────────────────────────┐
    │   NODE 6: TECHNICAL ANALYSIS 📈⚠️   │  ← NEW! RISK SENTINEL
    │  "Is it overbought? Any red flags?" │
    │  RSI, Moving Averages, Support      │
    │  ⚠️ STRICT RISK WARNINGS:           │
    │  - RSI > 70 → OVERBOUGHT ALERT      │
    │  - Negative news → AVOID NOW!       │
    │  - High volatility → SPECULATIVE    │
    └─────────────────┬───────────────────┘
                      │
                      ▼
    ┌─────────────────────────────────────┐
    │   NODE 7: INVESTMENT SUGGESTION 💡  │
    │  "Should I buy? How much?"          │
    │  RISK-AWARE recommendation          │
    │  Buy/sell/hold + quantity + horizon │
    │  + DISCLAIMER (not financial advice)│
    └─────────────────────────────────────┘

===================================================================================
"""

# =============================================================================
#                           IMPORTS SECTION
# =============================================================================

# ----- Standard Library Imports -----
import os
import json
from datetime import datetime
from typing import TypedDict, Annotated, List, Dict, Any, Optional

# ----- Load Environment Variables -----
from dotenv import load_dotenv
load_dotenv()

# ----- Fix LangChain Python 3.14 Compatibility -----
# This fixes "module 'langchain' has no attribute 'debug'" error
try:
    import langchain
    if not hasattr(langchain, 'debug'):
        langchain.debug = False
    if not hasattr(langchain, 'verbose'):
        langchain.verbose = False
except ImportError:
    # langchain-core is sufficient, langchain package not required
    pass
"""
📖 Why this fix?
----------------
Python 3.14 + LangChain has a compatibility issue.
The 'debug' attribute is missing from the langchain module.
We manually set it to prevent errors.

This is a temporary workaround until LangChain fully supports Python 3.14.
"""

# ----- LangGraph Imports -----
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
"""
📖 LangGraph Imports Explained
------------------------------

StateGraph: The main graph builder class
    - Creates a graph of nodes (functions)
    - Connects them with edges (flow)
    
START: Special node representing the entry point
END: Special node representing the exit point

add_messages: A "reducer" function
    - Tells LangGraph how to combine messages
    - When you return {"messages": [new_msg]}, it APPENDS to existing messages
    
🔗 In your notes (07-LangGraph/graph.py):
    from langgraph.graph import StateGraph, START, END
    from langgraph.graph.message import add_messages
    
SAME IMPORTS!
"""

# ----- OpenAI Import -----
from openai import OpenAI
"""
📖 We use OpenAI directly (not LangChain) for simplicity
    - More control over the API calls
    - Easier to understand what's happening
    - Same as your notes (03-Agents/main.py)
"""

# ----- Import Tools from tools_service -----
from tools_service import (
    smart_web_search,
    indian_stock_search,
    search_news,
    get_current_datetime,
    get_stock_price_yahoo
)
"""
📖 Our Tools
------------
We import the tools we created in Stage 1.
Each node will use these tools to gather information.
"""

# =============================================================================
#                     YFINANCE IMPORTS FOR REAL TECHNICAL ANALYSIS
# =============================================================================
# 
# 📌 WHY YFINANCE?
# ----------------
# Earlier, technical indicators (50-day MA, 200-day MA, Support, Resistance)
# showed "N/A" because we relied on web search + LLM extraction.
# Web search results rarely contain structured technical data.
#
# ✅ SOLUTION: Use yfinance to fetch REAL historical data and CALCULATE
# the indicators ourselves using pandas.
#
# 📖 INTERVIEW TALKING POINT:
# "Initially, technical analysis values were showing 'N/A' because web
# search doesn't return structured price history. I enhanced the system
# to use Yahoo Finance API (yfinance) to fetch 1-year historical data
# and calculate moving averages, support/resistance levels, and RSI
# using pandas. This gives REAL, CALCULATED values instead of N/A."
#
# =============================================================================
try:
    import yfinance as yf
    import pandas as pd
    import numpy as np
    YFINANCE_AVAILABLE = True
except ImportError:
    YFINANCE_AVAILABLE = False
    print("⚠️ yfinance not available - technical analysis will use web search only")
"""
📖 yfinance - Yahoo Finance Data
---------------------------------
Library: https://github.com/ranaroussi/yfinance

Used for:
- Historical price data (for moving averages) → ticker.history(period="1y")
- Technical indicators calculation → pandas rolling().mean()
- Support/resistance levels → from recent highs/lows
- Real-time stock info → ticker.info (P/E, beta, targets)

📌 INDIAN STOCK SYMBOLS:
- NSE: Add ".NS" suffix → "TCS.NS", "RELIANCE.NS"
- BSE: Add ".BO" suffix → "TCS.BO", "RELIANCE.BO"

📌 CALCULATIONS WE DO:
1. 50-Day Moving Average: hist['Close'].rolling(window=50).mean()
2. 200-Day Moving Average: hist['Close'].rolling(window=200).mean()
3. Support Level: 5% below recent 60-day low
4. Resistance Level: 5% above recent 60-day high
5. RSI (14-day): Standard RSI formula using price changes
"""

# =============================================================================
#                     INITIALIZE OPENAI CLIENT
# =============================================================================

client = OpenAI()
"""
📖 OpenAI Client
----------------
Reads OPENAI_API_KEY from environment automatically.

🔗 In your notes:
    client = OpenAI()
"""

# =============================================================================
#                     STATE DEFINITION
# =============================================================================

class StockResearchState(TypedDict):
    """
    📖 Stock Research State (Enhanced with 7 Nodes!)
    =================================================
    
    This defines the DATA that flows through our graph.
    Each node can READ from and WRITE to this state.
    
    📌 ENHANCED WORKFLOW (7 NODES):
    ------------------------------
    1. User sends query → Initial state created
    2. Node 1: COMPANY INTRO → Company overview, activities, locations
    3. Node 2: SECTOR ANALYST → Sector trends and outlook
    4. Node 3: COMPANY RESEARCHER → Financials and news
    5. Node 4: POLICY WATCHDOG → Government policies impact
    6. Node 5: INVESTOR SENTIMENT → Market sentiment analysis
    7. Node 6: INVESTMENT SUGGESTION → Buy/sell recommendation
    
    📌 WHY ANNOTATED[list, add_messages]?
    ------------------------------------
    This tells LangGraph: "When I return messages, APPEND them, don't replace."
    """
    
    # ----- Core Fields -----
    messages: Annotated[list, add_messages]
    """List of conversation messages (user + assistant)"""
    
    query: str
    """The original user query (e.g., "Tell me about Tata Motors")"""
    
    company_name: str
    """Extracted company name (e.g., "Tata Motors")"""
    
    # ----- NEW: Company Introduction -----
    company_intro: Optional[str]
    """Output from Node 1: Company overview, activities, locations"""
    
    # ----- Research Findings -----
    sector_analysis: Optional[str]
    """Output from Node 2: Sector trends and outlook"""
    
    company_research: Optional[str]
    """Output from Node 3: Company financials and news"""
    
    policy_analysis: Optional[str]
    """Output from Node 4: Government policies impact"""
    
    # ----- NEW: Investor Sentiment -----
    investor_sentiment: Optional[str]
    """Output from Node 5: Market sentiment and investor outlook"""
    
    # ----- NEW: Technical Analysis & Risk Sentinel -----
    technical_analysis: Optional[str]
    """Output from Node 6: RSI, moving averages, support/resistance"""
    
    risk_warnings: Optional[List[str]]
    """List of risk warnings (overbought, negative news, speculative)"""
    
    is_overbought: Optional[bool]
    """Flag: RSI > 70"""
    
    is_oversold: Optional[bool]
    """Flag: RSI < 30"""
    
    has_negative_news: Optional[bool]
    """Flag: Negative news detected - AVOID!"""
    
    is_speculative: Optional[bool]
    """Flag: High volatility/speculative zone"""
    
    # ----- Final Output -----
    investment_suggestion: Optional[str]
    """Output from Node 7: Buy/sell recommendation with quantity"""
    
    final_recommendation: Optional[str]
    """Combined final analysis and recommendation"""
    
    # ----- Metadata -----
    current_date: Optional[str]
    """Today's date for context"""
    
    search_results: Optional[Dict[str, Any]]
    """Raw search results for reference"""


# =============================================================================
#                     NODE 1: COMPANY INTRODUCTION (NEW!)
# =============================================================================

def company_intro_node(state: StockResearchState) -> Dict[str, Any]:
    """
    📖 Node 1: Company Introduction 🏢
    ==================================
    
    GOAL: Provide a comprehensive introduction to the company.
    
    WHAT IT DOES:
    1. Searches for company overview and history
    2. Lists key activities and business segments
    3. Shows manufacturing units and presence
    4. Provides a snapshot of what the company does
    
    📌 EXAMPLE OUTPUT:
    -----------------
    Bharat Electronics Limited (BEL) is an Indian state-owned aerospace 
    and defense electronics company...
    
    Key Activities:
    - Manufacturing: Advanced electronic products for defense
    - Diversification: Smart cities, e-governance, EVs
    
    Locations:
    - Bengaluru (HQ), Hyderabad, Pune, Chennai...
    """
    print("\n" + "="*60)
    print("🏢 NODE 1: COMPANY INTRODUCTION")
    print("="*60)
    
    company = state.get("company_name", state["query"])
    
    print(f"📌 Researching: {company}")
    
    try:
        # Search for company overview
        overview_query = f"{company} company overview history headquarters India"
        overview_results = smart_web_search(overview_query, max_results=3)
        print(f"✅ Found company overview")
        
        # Search for business segments
        business_query = f"{company} business segments products services key activities"
        business_results = smart_web_search(business_query, max_results=3)
        print(f"✅ Found business segments")
        
        # Search for locations
        location_query = f"{company} manufacturing plants offices locations India"
        location_results = smart_web_search(location_query, max_results=2)
        print(f"✅ Found company locations")
        
        # Use LLM to create a structured company introduction
        intro_prompt = f"""
        Based on the following search results, create a comprehensive COMPANY INTRODUCTION for {company}.
        
        COMPANY OVERVIEW:
        {json.dumps(overview_results.get("results", []), indent=2)}
        
        BUSINESS SEGMENTS:
        {json.dumps(business_results.get("results", []), indent=2)}
        
        LOCATIONS:
        {json.dumps(location_results.get("results", []), indent=2)}
        
        Please provide a structured introduction with:
        
        **🏢 About {company}**
        [2-3 sentence overview of the company - what it is, when founded, parent company if any]
        
        **📋 Key Activities & Business Segments**
        - [Business segment 1]: Brief description
        - [Business segment 2]: Brief description
        - [Add 3-5 key activities]
        
        **🏭 Manufacturing Units & Presence**
        - [Location 1]: What's there
        - [Location 2]: What's there
        - [List major locations across India]
        
        **📊 Quick Facts**
        - Industry: [sector]
        - Type: [Public/Private/PSU]
        - Employees: [if available]
        - Stock Exchange: NSE/BSE [ticker if available]
        
        Keep it informative and concise. This is an INTRODUCTION, not analysis.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": intro_prompt}]
        )
        
        company_intro = response.choices[0].message.content
        
        print(f"✅ Company introduction complete!")
        
        # NOTE: Don't add to messages here - only final node adds the combined message
        return {
            "company_intro": company_intro
        }
        
    except Exception as e:
        print(f"❌ Error in company introduction: {e}")
        return {
            "company_intro": f"Error getting company info: {str(e)}"
        }


# =============================================================================
#                     NODE 2: SECTOR ANALYST
# =============================================================================

def sector_analyst_node(state: StockResearchState) -> Dict[str, Any]:
    """
    📖 Node 2: Sector Analyst 🏭
    ============================
    
    GOAL: Understand the broader market context using company introduction.
    
    WHAT IT DOES:
    1. Reads company intro to identify the sector
    2. Searches for sector trends and growth
    3. Provides sector outlook
    
    📌 ENHANCED: Uses Company Introduction to identify sector!
    """
    print("\n" + "="*60)
    print("🏭 NODE 2: SECTOR ANALYST")
    print("="*60)
    
    query = state["query"]
    company = state.get("company_name", query)
    company_intro = state.get("company_intro", "")  # 🆕 Get from previous node
    
    # Get current date for context
    date_info = get_current_datetime()
    current_date = date_info.get("formatted", "")
    
    print(f"📌 Analyzing sector for: {company}")
    print(f"📅 Date: {current_date}")
    
    # 🆕 Use Company Introduction to identify sector (more accurate!)
    sector_prompt = f"""
    You are a financial sector analyst.
    
    Company: {company}
    
    COMPANY INTRODUCTION (from previous research):
    {company_intro}
    
    Based on the company introduction above:
    1. Identify the PRIMARY sector this company belongs to (e.g., Defense, Auto, IT, Pharma, Banking, FMCG, etc.)
    2. Create a search query to find sector trends in India
    
    Respond in JSON format:
    {{
        "sector": "the primary sector name",
        "sub_sectors": ["list of sub-sectors if any"],
        "search_query": "search query for sector trends India 2024"
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": sector_prompt}]
        )
        
        sector_info = json.loads(response.choices[0].message.content)
        sector_name = sector_info.get("sector", "Unknown")
        sub_sectors = sector_info.get("sub_sectors", [])
        search_query = sector_info.get("search_query", f"{sector_name} sector trends India")
        
        print(f"🔍 Identified Sector: {sector_name}")
        if sub_sectors:
            print(f"🔍 Sub-sectors: {', '.join(sub_sectors)}")
        print(f"🔍 Search Query: {search_query}")
        
        # Search for sector information
        search_results = smart_web_search(search_query, max_results=3)
        
        # Summarize sector findings
        results_text = json.dumps(search_results.get("results", []), indent=2)
        
        summary_prompt = f"""
        You are a sector analyst. Based on the search results below, provide a sector analysis.
        
        Primary Sector: {sector_name}
        Sub-sectors: {', '.join(sub_sectors) if sub_sectors else 'N/A'}
        Company in question: {company}
        
        Search Results:
        {results_text}
        
        Provide a structured sector analysis:
        
        **Sector: {sector_name}**
        
        📈 **Growth Trends:**
        - [Current market size and growth rate]
        - [Key growth drivers]
        
        🌟 **Sector Outlook:**
        - [2-3 sentences on future prospects]
        - [Sentiment: Positive/Negative/Neutral with reason]
        
        Keep it informative and concise (150-200 words).
        """
        
        summary_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": summary_prompt}]
        )
        
        sector_analysis = summary_response.choices[0].message.content
        
        print(f"✅ Sector Analysis Complete")
        
        # NOTE: Don't add to messages here - only final node adds the combined message
        # This prevents duplication in the output
        return {
            "sector_analysis": sector_analysis,
            "current_date": current_date
        }
        
    except Exception as e:
        print(f"❌ Error in sector analysis: {e}")
        return {
            "sector_analysis": f"Could not analyze sector: {str(e)}",
            "current_date": current_date
        }


# =============================================================================
#                     NODE 3: COMPANY RESEARCHER
# =============================================================================

def company_researcher_node(state: StockResearchState) -> Dict[str, Any]:
    """
    📖 Node 3: Company Researcher 🕵️
    =================================
    
    GOAL: Get specific company data from TRUSTED sources.
    
    WHAT IT DOES:
    1. Uses indian_stock_search() (NOT regular web search!)
    2. Searches MoneyControl, Screener, Economic Times ONLY
    3. Gets quarterly results, financials, recent news
    
    🔗 In your workflow:
        Step 2 - COMPANY CHECK:
        - Use "indian_stock_search" (NOT regular web_search!)
        - Check 3 sources for Quarterly results
    
    📌 WHY TRUSTED SOURCES ONLY?
    ---------------------------
    Random blogs = outdated info, speculation, clickbait
    MoneyControl/Screener = authentic financial data, verified news
    
    This makes your analysis RELIABLE!
    """
    print("\n" + "="*60)
    print("🕵️ NODE 3: COMPANY RESEARCHER")
    print("="*60)
    
    company = state.get("company_name", state["query"])
    
    print(f"📌 Researching company: {company}")
    print(f"🔍 Using TRUSTED sources: MoneyControl, Screener, ET")
    
    try:
        # Use indian_stock_search - filters to trusted sites only!
        search_results = indian_stock_search(
            query=f"{company} quarterly results news",
            max_results=5
        )
        
        print(f"📊 Found {len(search_results.get('results', []))} results from trusted sources")
        
        # Summarize company findings
        results_text = json.dumps(search_results.get("results", []), indent=2)
        
        summary_prompt = f"""
        You are a company research analyst. Based on the search results from trusted 
        Indian financial websites (MoneyControl, Screener, Economic Times), provide 
        a company analysis.
        
        Company: {company}
        
        Search Results (from trusted sources only):
        {results_text}
        
        Provide a summary covering:
        1. Recent financial performance (revenue, profit if mentioned)
        2. Key news or developments
        3. Stock price movement if mentioned
        
        Keep it to 3-4 sentences. Only use facts from the search results.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": summary_prompt}]
        )
        
        company_research = response.choices[0].message.content
        
        print(f"✅ Company Research Complete")
        print(f"📊 Summary: {company_research[:100]}...")
        
        return {
            "company_research": f"**Company: {company}**\n\n🌐 **Web Search Results (MoneyControl, Screener, ET):**\n{company_research}",
            "search_results": search_results
        }
        
    except Exception as e:
        print(f"❌ Error in company research: {e}")
        return {
            "company_research": f"Could not research company: {str(e)}"
        }


# =============================================================================
#                     NODE 3: POLICY WATCHDOG
# =============================================================================

def policy_watchdog_node(state: StockResearchState) -> Dict[str, Any]:
    """
    📖 Node 3: Policy Watchdog ⚖️
    =============================
    
    GOAL: Identify government policies that might impact the stock.
    
    WHAT IT DOES:
    1. Searches for recent policy news
    2. Looks for regulatory changes, sanctions, subsidies
    3. Assesses policy impact on the company/sector
    
    🔗 In your workflow:
        Step 4 - POLICY CHECK:
        - Any policy-related changes
        - USA sanctions, Indian govt policies
        - Which might impact the sector or company
    
    📌 WHY THIS MATTERS:
    -------------------
    Example: If govt announces new EV subsidies → Tata Motors stock goes UP
    Example: If US sanctions a company → Stock goes DOWN
    
    Policy awareness = Better investment decisions!
    """
    print("\n" + "="*60)
    print("⚖️ NODE 3: POLICY WATCHDOG")
    print("="*60)
    
    company = state.get("company_name", state["query"])
    sector_analysis = state.get("sector_analysis", "")
    
    # Extract sector from previous analysis
    sector = "general"
    if "Sector:" in sector_analysis:
        sector = sector_analysis.split("Sector:")[1].split("\n")[0].strip().strip("*")
    
    print(f"📌 Checking policies for: {company}")
    print(f"📌 Sector: {sector}")
    
    try:
        # Search for policy news
        policy_query = f"government policy {sector} India 2024"
        news_results = search_news(policy_query, max_results=3)
        
        print(f"📰 Found {len(news_results.get('results', []))} policy-related news")
        
        # Also check for specific company policy impacts
        company_policy_query = f"{company} government policy regulation news"
        company_news = smart_web_search(company_policy_query, max_results=2)
        
        # Combine results
        all_results = news_results.get("results", []) + company_news.get("results", [])
        results_text = json.dumps(all_results, indent=2)
        
        summary_prompt = f"""
        You are a policy analyst. Based on the news results, identify any 
        government policies or regulations that might impact this company.
        
        Company: {company}
        Sector: {sector}
        
        News Results:
        {results_text}
        
        Provide a brief analysis:
        1. Any recent policy changes affecting this sector?
        2. Any regulations or sanctions to be aware of?
        3. Any government incentives or subsidies?
        
        If no significant policy news found, say "No major policy changes identified."
        Keep it to 2-3 sentences.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": summary_prompt}]
        )
        
        policy_analysis = response.choices[0].message.content
        
        print(f"✅ Policy Analysis Complete")
        print(f"📋 Summary: {policy_analysis[:100]}...")
        
        # NOTE: Don't add to messages here - only final node adds the combined message
        return {
            "policy_analysis": f"**Policy Impact:**\n\n{policy_analysis}"
        }
        
    except Exception as e:
        print(f"❌ Error in policy analysis: {e}")
        return {
            "policy_analysis": "No policy analysis available."
        }


# =============================================================================
#                     NODE 5: INVESTOR SENTIMENT (NEW!)
# =============================================================================

def investor_sentiment_node(state: StockResearchState) -> Dict[str, Any]:
    """
    📖 Node 5: Investor Sentiment 📊
    ================================
    
    GOAL: Analyze market sentiment and investor outlook.
    
    WHAT IT DOES:
    1. Searches for investor sentiment and ratings
    2. Checks analyst recommendations
    3. Analyzes FII/DII holdings
    4. Provides sentiment summary
    """
    print("\n" + "="*60)
    print("📊 NODE 5: INVESTOR SENTIMENT")
    print("="*60)
    
    company = state.get("company_name", state["query"])
    
    print(f"📌 Analyzing investor sentiment for: {company}")
    
    try:
        # Search for investor sentiment
        sentiment_query = f"{company} stock investor sentiment analyst rating buy sell hold"
        sentiment_results = smart_web_search(sentiment_query, max_results=3)
        print(f"✅ Found investor sentiment data")
        
        # Search for FII/DII holdings
        holdings_query = f"{company} FII DII shareholding pattern institutional investors"
        holdings_results = smart_web_search(holdings_query, max_results=2)
        print(f"✅ Found institutional holdings data")
        
        # Search for recent analyst calls (INDIAN sources - Rupees!)
        analyst_query = f"{company} stock target price analyst recommendation India NSE BSE rupees"
        analyst_results = smart_web_search(analyst_query, max_results=2)
        print(f"✅ Found analyst recommendations")
        
        # Use LLM to summarize sentiment
        sentiment_prompt = f"""
        Based on the following search results, provide an INVESTOR SENTIMENT analysis for {company}.
        
        IMPORTANT: This is an INDIAN stock. All prices MUST be in Indian Rupees (₹), NOT dollars ($).
        
        INVESTOR SENTIMENT DATA:
        {json.dumps(sentiment_results.get("results", []), indent=2)}
        
        INSTITUTIONAL HOLDINGS:
        {json.dumps(holdings_results.get("results", []), indent=2)}
        
        ANALYST RECOMMENDATIONS:
        {json.dumps(analyst_results.get("results", []), indent=2)}
        
        Provide a structured sentiment analysis:
        
        **📊 Investor Sentiment Analysis**
        
        🎯 **Overall Sentiment:** [Bullish 🟢 / Bearish 🔴 / Neutral 🟡]
        
        📈 **Analyst Ratings:**
        - Buy/Sell/Hold recommendations from Indian analysts
        - Target price range in ₹ (Rupees) - NOT dollars!
        
        🏛️ **Institutional Interest:**
        - FII (Foreign Institutional Investors) holdings trend
        - DII (Domestic Institutional Investors) holdings trend
        - Key changes in shareholding pattern
        
        💬 **Market Buzz:**
        - What are Indian investors/analysts saying?
        - Recent sentiment drivers in Indian market
        
        ⚡ **Sentiment Score:** [1-10] with brief justification
        
        CRITICAL: Use ₹ symbol for all prices. Example: "Target: ₹500 - ₹600" NOT "$500 - $600"
        
        Keep it concise and data-driven (150-200 words).
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": sentiment_prompt}]
        )
        
        investor_sentiment = response.choices[0].message.content
        
        print(f"✅ Investor Sentiment Analysis Complete")
        
        # NOTE: Don't add to messages here - only final node adds the combined message
        return {
            "investor_sentiment": investor_sentiment
        }
        
    except Exception as e:
        print(f"❌ Error in investor sentiment analysis: {e}")
        return {
            "investor_sentiment": "Investor sentiment data not available."
        }


# =============================================================================
#                     NODE 6: TECHNICAL ANALYSIS & RISK CHECK (NEW!)
# =============================================================================

def technical_analysis_node(state: StockResearchState) -> Dict[str, Any]:
    """
    📖 Node 6: Technical Analysis & Risk Sentinel 📈⚠️
    ==================================================
    
    GOAL: Provide technical indicators with BEGINNER-FRIENDLY explanations and STRICT risk warnings.
    
    WHAT IT DOES:
    1. Searches for RSI (14-day), P/E ratio, moving averages, support/resistance
    2. Checks if stock is OVERBOUGHT (RSI > 70) or OVERSOLD (RSI < 30)
    3. Evaluates P/E ratio (expensive vs undervalued)
    4. Detects NEGATIVE NEWS and issues strict warnings
    5. Flags "SPECULATIVE ZONE" if high volatility detected
    6. Explains each term so BEGINNERS can understand!
    
    📌 RULE-BASED WARNINGS (Not just LLM opinion!):
    - RSI > 70 → "⚠️ OVERBOUGHT - Wait for correction"
    - RSI < 30 → "🟢 OVERSOLD - Potential buying opportunity"
    - P/E > 40 → "💰 EXPENSIVE - Trading at high valuation"
    - Negative news → "🚨 AVOID NOW - Negative news found"
    - High volatility → "⚡ SPECULATIVE ZONE - High risk"
    
    📌 WHY THIS NODE?
    Users asked: "Warn me if the share is in speculative zone/overbought"
    And: "Explain these terms so beginners can understand"
    This node provides safety checks AND education!
    """
    print("\n" + "="*60)
    print("📈 NODE 6: TECHNICAL ANALYSIS & RISK SENTINEL")
    print("="*60)
    
    company = state.get("company_name", state["query"])
    company_research = state.get("company_research", "")
    investor_sentiment = state.get("investor_sentiment", "")
    
    print(f"📌 Technical analysis for: {company}")
    
    # Initialize risk flags
    risk_warnings = []
    is_overbought = False
    is_oversold = False
    has_negative_news = False
    is_speculative = False
    
    try:
        # =====================================================================
        # STEP 1: Get Real Stock Data from Yahoo Finance
        # =====================================================================
        tech_data_from_yahoo = {}
        
        # =====================================================================
        # COMPREHENSIVE INDIAN STOCK SYMBOL MAPPING (200+ Stocks)
        # =====================================================================
        #
        # 📌 WHY THIS MAPPING?
        # --------------------
        # When user says "Tell me about Hindustan Aeronautics", we need to 
        # convert that to "HAL" (the NSE symbol) to query Yahoo Finance.
        #
        # Earlier: Only ~30 stocks mapped → Many stocks showed "N/A"
        # Now: 200+ stocks mapped → Almost all Indian stocks work!
        #
        # 📖 INTERVIEW TALKING POINT:
        # "I maintain a comprehensive mapping of 200+ Indian stock names to
        # their NSE symbols. This handles variations like 'Hindustan Aeronautics'
        # → 'HAL', 'State Bank of India' → 'SBIN'. For unknown stocks, I try
        # to generate an acronym from the company name as a fallback."
        #
        # 📌 HOW TO ADD NEW STOCKS:
        # Just add: "company name lowercase": "SYMBOL"
        # Example: "zomato": "ZOMATO"
        #
        # =====================================================================
        symbol_mapping = {
            # IT Sector
            "tata consultancy services": "TCS",
            "tcs": "TCS",
            "infosys": "INFY",
            "infy": "INFY",
            "wipro": "WIPRO",
            "hcl technologies": "HCLTECH",
            "hcltech": "HCLTECH",
            "hcl tech": "HCLTECH",
            "tech mahindra": "TECHM",
            "techm": "TECHM",
            "ltimindtree": "LTIM",
            "l&t infotech": "LTIM",
            "mphasis": "MPHASIS",
            "persistent": "PERSISTENT",
            "coforge": "COFORGE",
            
            # Banking Sector
            "hdfc bank": "HDFCBANK",
            "hdfcbank": "HDFCBANK",
            "icici bank": "ICICIBANK",
            "icicibank": "ICICIBANK",
            "state bank": "SBIN",
            "sbi": "SBIN",
            "axis bank": "AXISBANK",
            "axisbank": "AXISBANK",
            "kotak mahindra": "KOTAKBANK",
            "kotakbank": "KOTAKBANK",
            "kotak bank": "KOTAKBANK",
            "indusind bank": "INDUSINDBK",
            "indusindbk": "INDUSINDBK",
            "federal bank": "FEDERALBNK",
            "bandhan bank": "BANDHANBNK",
            "idfc first": "IDFCFIRSTB",
            "yes bank": "YESBANK",
            "bank of baroda": "BANKBARODA",
            "punjab national": "PNB",
            "pnb": "PNB",
            "canara bank": "CANBK",
            
            # Auto Sector
            "tata motors": "TATAMOTORS",
            "tatamotors": "TATAMOTORS",
            "maruti": "MARUTI",
            "maruti suzuki": "MARUTI",
            "mahindra": "M&M",
            "m&m": "M&M",
            "bajaj auto": "BAJAJ-AUTO",
            "hero motocorp": "HEROMOTOCO",
            "eicher motors": "EICHERMOT",
            "tvs motor": "TVSMOTOR",
            "ashok leyland": "ASHOKLEY",
            
            # Oil & Gas
            "reliance": "RELIANCE",
            "reliance industries": "RELIANCE",
            "ongc": "ONGC",
            "oil and natural gas": "ONGC",
            "indian oil": "IOC",
            "ioc": "IOC",
            "bpcl": "BPCL",
            "bharat petroleum": "BPCL",
            "hpcl": "HPCL",
            "hindustan petroleum": "HPCL",
            "gail": "GAIL",
            "petronet lng": "PETRONET",
            
            # Pharma & Healthcare
            "sun pharma": "SUNPHARMA",
            "sunpharma": "SUNPHARMA",
            "dr reddy": "DRREDDY",
            "drreddy": "DRREDDY",
            "cipla": "CIPLA",
            "divi's lab": "DIVISLAB",
            "divislab": "DIVISLAB",
            "lupin": "LUPIN",
            "aurobindo pharma": "AUROPHARMA",
            "biocon": "BIOCON",
            "torrent pharma": "TORNTPHARM",
            "alkem": "ALKEM",
            "apollo hospitals": "APOLLOHOSP",
            "fortis healthcare": "FORTIS",
            "max healthcare": "MAXHEALTH",
            
            # FMCG
            "hindustan unilever": "HINDUNILVR",
            "hindunilvr": "HINDUNILVR",
            "hul": "HINDUNILVR",
            "itc": "ITC",
            "nestle": "NESTLEIND",
            "nestle india": "NESTLEIND",
            "britannia": "BRITANNIA",
            "dabur": "DABUR",
            "godrej consumer": "GODREJCP",
            "marico": "MARICO",
            "colgate": "COLPAL",
            "tata consumer": "TATACONSUM",
            "varun beverages": "VBL",
            
            # Metals & Mining
            "tata steel": "TATASTEEL",
            "tatasteel": "TATASTEEL",
            "jsw steel": "JSWSTEEL",
            "jswsteel": "JSWSTEEL",
            "hindalco": "HINDALCO",
            "vedanta": "VEDL",
            "vedl": "VEDL",
            "coal india": "COALINDIA",
            "nmdc": "NMDC",
            "sail": "SAIL",
            "jindal steel": "JINDALSTEL",
            
            # Infrastructure & Construction
            "larsen": "LT",
            "l&t": "LT",
            "larsen & toubro": "LT",
            "adani ports": "ADANIPORTS",
            "adaniports": "ADANIPORTS",
            "adani enterprises": "ADANIENT",
            "adanient": "ADANIENT",
            "adani green": "ADANIGREEN",
            "adani power": "ADANIPOWER",
            "adani total gas": "ATGL",
            "ultratech": "ULTRACEMCO",
            "ultracemco": "ULTRACEMCO",
            "ultratech cement": "ULTRACEMCO",
            "shree cement": "SHREECEM",
            "ambuja cement": "AMBUJACEM",
            "acc": "ACC",
            "dlf": "DLF",
            "godrej properties": "GODREJPROP",
            "oberoi realty": "OBEROIRLTY",
            
            # Telecom
            "bharti airtel": "BHARTIARTL",
            "bhartiartl": "BHARTIARTL",
            "airtel": "BHARTIARTL",
            "jio": "RELIANCE",
            "vodafone idea": "IDEA",
            "idea": "IDEA",
            
            # Finance & Insurance
            "bajaj finance": "BAJFINANCE",
            "bajfinance": "BAJFINANCE",
            "bajaj finserv": "BAJAJFINSV",
            "hdfc life": "HDFCLIFE",
            "sbi life": "SBILIFE",
            "icici prudential": "ICICIPRULI",
            "lic housing": "LICHSGFIN",
            "hdfc amc": "HDFCAMC",
            "sbi card": "SBICARD",
            "muthoot finance": "MUTHOOTFIN",
            "cholamandalam": "CHOLAFIN",
            "shriram finance": "SHRIRAMFIN",
            
            # Power & Utilities
            "ntpc": "NTPC",
            "power grid": "POWERGRID",
            "powergrid": "POWERGRID",
            "tata power": "TATAPOWER",
            "tatapower": "TATAPOWER",
            "jsw energy": "JSWENERGY",
            "nhpc": "NHPC",
            "torrent power": "TORNTPOWER",
            
            # Chemicals & Fertilizers
            "pidilite": "PIDILITIND",
            "asian paints": "ASIANPAINT",
            "asianpaint": "ASIANPAINT",
            "berger paints": "BERGEPAINT",
            "srf": "SRF",
            "upl": "UPL",
            "coromandel": "COROMANDEL",
            "aarti industries": "AARTIIND",
            
            # Defence & Aerospace
            "hindustan aeronautics": "HAL",
            "hal": "HAL",
            "hindustan aero": "HAL",
            "bharat electronics": "BEL",
            "bel": "BEL",
            "bharat dynamics": "BDL",
            "bdl": "BDL",
            "mazagon dock": "MAZDOCK",
            "cochin shipyard": "COCHINSHIP",
            "bharat forge": "BHARATFORG",
            
            # Railways & PSU
            "irctc": "IRCTC",
            "indian railway catering": "IRCTC",
            "rvnl": "RVNL",
            "rail vikas": "RVNL",
            "irfc": "IRFC",
            "indian railway finance": "IRFC",
            "rites": "RITES",
            
            # Others
            "titan": "TITAN",
            "avenue supermarts": "DMART",
            "dmart": "DMART",
            "zomato": "ZOMATO",
            "paytm": "PAYTM",
            "nykaa": "NYKAA",
            "policybazaar": "POLICYBZR",
            "ipo": "IPO",
            "trent": "TRENT",
            "page industries": "PAGEIND",
            "indigo": "INDIGO",
            "interglobe": "INDIGO",
            "havells": "HAVELLS",
            "dixon": "DIXON",
            "polycab": "POLYCAB",
            "siemens": "SIEMENS",
            "abb": "ABB",
            "cummins": "CUMMINSIND"
        }
        
        # Try to find symbol
        company_lower = company.lower()
        stock_symbol = None
        for key, symbol in symbol_mapping.items():
            if key in company_lower:
                stock_symbol = symbol
                break
        
        # If not found in mapping, try common abbreviations and patterns
        if not stock_symbol:
            words = company.split()
            # Try acronym (first letter of each word)
            if len(words) >= 2:
                acronym = ''.join(word[0].upper() for word in words if word)
                if 2 <= len(acronym) <= 6:
                    stock_symbol = acronym
            # Fallback: try first word
            if not stock_symbol and len(words) > 0:
                first_word = words[0].upper()
                if 3 <= len(first_word) <= 10 and first_word.isalpha():
                    stock_symbol = first_word
        
        print(f"📊 Attempting to fetch real data for symbol: {stock_symbol}")
        
        # =====================================================================
        # FETCH REAL DATA FROM YAHOO FINANCE
        # =====================================================================
        #
        # 📖 INTERVIEW TALKING POINT:
        # "I use a hybrid approach - first try to get real data from Yahoo
        # Finance API, then fall back to web search for any missing data.
        # This ensures we always show actual calculated values for moving
        # averages and support/resistance, not LLM guesses."
        #
        # =====================================================================
        if YFINANCE_AVAILABLE and stock_symbol:
            try:
                # Get basic stock data (price, P/E, 52-week range)
                yahoo_data = get_stock_price_yahoo(stock_symbol, "NSE")
                
                if not yahoo_data.get("error"):
                    tech_data_from_yahoo = {
                        "current_price": yahoo_data.get("current_price"),
                        "pe_ratio": yahoo_data.get("pe_ratio"),
                        "52_week_high": yahoo_data.get("52_week_high"),
                        "52_week_low": yahoo_data.get("52_week_low"),
                        "beta": None,  # Will try to get from yfinance directly
                        "eps": None    # Will try to get from yfinance directly
                    }
                    print(f"✅ Got real data from Yahoo Finance")
                    
                    # ==========================================================
                    # CALCULATE TECHNICAL INDICATORS FROM HISTORICAL DATA
                    # ==========================================================
                    #
                    # 📌 WHY CALCULATE OURSELVES?
                    # Web search returns text like "50-day MA is around 1500"
                    # but yfinance gives us actual daily prices, so we can
                    # calculate EXACT values using pandas!
                    #
                    # 📖 INTERVIEW TALKING POINT:
                    # "I fetch 1 year of daily price data and use pandas
                    # rolling window functions to calculate moving averages.
                    # For support/resistance, I look at recent 60-day highs
                    # and lows with a 5% buffer."
                    #
                    # ==========================================================
                    try:
                        yahoo_symbol = f"{stock_symbol}.NS"
                        ticker = yf.Ticker(yahoo_symbol)
                        
                        # Fetch 1 year of daily OHLCV data
                        # (Open, High, Low, Close, Volume)
                        hist = ticker.history(period="1y", interval="1d")
                        
                        if not hist.empty and len(hist) > 200:
                            # -------------------------------------------------
                            # 50-DAY MOVING AVERAGE
                            # -------------------------------------------------
                            # Formula: Average of last 50 closing prices
                            # Usage: Short-term trend indicator
                            # If price > MA50 → Short-term bullish
                            # If price < MA50 → Short-term bearish
                            # -------------------------------------------------
                            hist['MA50'] = hist['Close'].rolling(window=50).mean()
                            ma_50 = hist['MA50'].iloc[-1]
                            tech_data_from_yahoo["moving_avg_50"] = float(ma_50) if not pd.isna(ma_50) else None
                            
                            # -------------------------------------------------
                            # 200-DAY MOVING AVERAGE
                            # -------------------------------------------------
                            # Formula: Average of last 200 closing prices
                            # Usage: Long-term trend indicator
                            # "Golden Cross": MA50 crosses above MA200 → Bullish
                            # "Death Cross": MA50 crosses below MA200 → Bearish
                            # -------------------------------------------------
                            hist['MA200'] = hist['Close'].rolling(window=200).mean()
                            ma_200 = hist['MA200'].iloc[-1]
                            tech_data_from_yahoo["moving_avg_200"] = float(ma_200) if not pd.isna(ma_200) else None
                            
                            # -------------------------------------------------
                            # SUPPORT LEVEL
                            # -------------------------------------------------
                            # Logic: Recent 60-day low minus 5% buffer
                            # Usage: Price tends to bounce UP from support
                            # Good entry point for buying
                            # -------------------------------------------------
                            recent_lows = hist['Low'].tail(60).min()
                            current_price = tech_data_from_yahoo.get("current_price") or hist['Close'].iloc[-1]
                            tech_data_from_yahoo["support_level"] = float(recent_lows * 0.95)
                            
                            # -------------------------------------------------
                            # RESISTANCE LEVEL
                            # -------------------------------------------------
                            # Logic: Recent 60-day high plus 5% buffer
                            # Usage: Price tends to fall DOWN from resistance
                            # Good exit point for selling
                            # -------------------------------------------------
                            recent_highs = hist['High'].tail(60).max()
                            tech_data_from_yahoo["resistance_level"] = float(recent_highs * 1.05)
                            
                            # -------------------------------------------------
                            # RSI (RELATIVE STRENGTH INDEX) - 14 DAY
                            # -------------------------------------------------
                            # Formula: 100 - (100 / (1 + RS))
                            # where RS = Average Gain / Average Loss over 14 days
                            #
                            # RSI > 70 → OVERBOUGHT (may fall soon)
                            # RSI < 30 → OVERSOLD (may rise soon)
                            # RSI 30-70 → NEUTRAL
                            #
                            # 📖 INTERVIEW TALKING POINT:
                            # "RSI measures momentum. I calculate it using the
                            # standard 14-day formula: average gains divided by
                            # average losses. Above 70 signals overbought
                            # conditions, below 30 signals oversold."
                            # -------------------------------------------------
                            try:
                                delta = hist['Close'].diff()  # Daily price change
                                gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()  # Avg gains
                                loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()  # Avg losses
                                rs = gain / loss  # Relative Strength
                                rsi = 100 - (100 / (1 + rs))  # RSI formula
                                rsi_value = rsi.iloc[-1]
                                if not pd.isna(rsi_value):
                                    tech_data_from_yahoo["rsi_value"] = float(rsi_value)
                            except:
                                pass
                            
                            print(f"✅ Calculated moving averages and support/resistance")
                            
                        # -------------------------------------------------
                        # ADDITIONAL DATA FROM YAHOO FINANCE
                        # -------------------------------------------------
                        # EPS, Beta, and Analyst Target Prices come directly
                        # from Yahoo Finance's info dictionary
                        # -------------------------------------------------
                        info = ticker.info
                        if info:
                            if "trailingEps" in info:
                                tech_data_from_yahoo["eps"] = info.get("trailingEps")
                            if "beta" in info:
                                tech_data_from_yahoo["beta"] = info.get("beta")
                            # Analyst target prices (from Yahoo Finance analyst consensus)
                            if "targetMeanPrice" in info:
                                tech_data_from_yahoo["target_price_avg"] = info.get("targetMeanPrice")
                            if "targetHighPrice" in info:
                                tech_data_from_yahoo["target_price_high"] = info.get("targetHighPrice")
                            if "targetLowPrice" in info:
                                tech_data_from_yahoo["target_price_low"] = info.get("targetLowPrice")
                            
                    except Exception as hist_error:
                        print(f"⚠️ Historical data fetch failed: {hist_error}")
                
            except Exception as yahoo_error:
                print(f"⚠️ Yahoo Finance fetch failed: {yahoo_error}")
        
        # =====================================================================
        # STEP 2: Fallback to Web Search for Missing Data
        # =====================================================================
        
        # Search for RSI if not from yfinance
        if "rsi_value" not in tech_data_from_yahoo:
            rsi_query = f"{company} stock RSI technical analysis India"
            rsi_results = smart_web_search(rsi_query, max_results=2)
        else:
            rsi_results = {"results": []}
        
        # Search for P/E ratio if not from yfinance
        if not tech_data_from_yahoo.get("pe_ratio"):
            pe_query = f"{company} stock P/E ratio EPS valuation India NSE BSE"
            pe_results = smart_web_search(pe_query, max_results=2)
        else:
            pe_results = {"results": []}
        
        # Search for target price if not from yfinance
        if not any(k in tech_data_from_yahoo for k in ["target_price_avg", "target_price_high", "target_price_low"]):
            target_query = f"{company} stock target price analyst recommendation India NSE rupees"
            target_results = smart_web_search(target_query, max_results=2)
        else:
            target_results = {"results": []}
        
        # Search for volatility data
        volatility_query = f"{company} stock volatility beta India"
        volatility_results = smart_web_search(volatility_query, max_results=2)
        
        # Search for any negative news (CRITICAL!)
        negative_news_query = f"{company} stock fraud scam loss bankruptcy investigation SEBI warning"
        negative_news_results = search_news(negative_news_query, max_results=3)
        print(f"✅ Checked for negative news")
        
        # =====================================================================
        # STEP 3: Use LLM to extract missing technical indicators from web search
        # =====================================================================
        
        # Merge yfinance data with web search results
        analysis_prompt = f"""
        You are a technical analyst with STRICT risk management rules.
        This is for an INDIAN stock traded on NSE/BSE. All prices must be in ₹ (Rupees).
        
        REAL DATA FROM YAHOO FINANCE (USE THIS IF AVAILABLE):
        {json.dumps(tech_data_from_yahoo, indent=2)}
        
        WEB SEARCH RESULTS (USE IF YAHOO DATA MISSING):
        RSI/Technical Data:
        {json.dumps(rsi_results.get("results", [])[:2], indent=2)}
        
        P/E Ratio & Valuation:
        {json.dumps(pe_results.get("results", [])[:2], indent=2)}
        
        Target Price Data:
        {json.dumps(target_results.get("results", [])[:2], indent=2)}
        
        Volatility Data:
        {json.dumps(volatility_results.get("results", [])[:2], indent=2)}
        
        Negative News Check:
        {json.dumps(negative_news_results.get("results", []), indent=2)}
        
        PREVIOUS COMPANY RESEARCH:
        {company_research[:500] if company_research else "Not available"}
        
        Instructions:
        - PRIORITIZE data from "REAL DATA FROM YAHOO FINANCE" section above
        - Only use web search results if Yahoo Finance data is missing/null
        - Extract missing values from web search if needed
        - All prices MUST be in Indian Rupees (₹), NOT dollars
        
        Respond in JSON format with ALL fields (use Yahoo data when available):
        {{
            "current_price": <from yahoo or extract from web, number in Rupees or null>,
            "rsi_value": <from yahoo or extract, number or null>,
            "rsi_status": <calculate: "overbought" if rsi > 70, "oversold" if rsi < 30, else "neutral">,
            "pe_ratio": <from yahoo or extract, number or null>,
            "pe_status": <calculate: "expensive" if pe > 40, "undervalued" if pe < 15, else "fairly_valued">,
            "industry_pe": <extract from web, number or null>,
            "eps": <from yahoo or extract, number or null>,
            "moving_avg_50": <from yahoo, number in Rupees or null>,
            "moving_avg_200": <from yahoo, number in Rupees or null>,
            "support_level": <from yahoo, number in Rupees or null>,
            "resistance_level": <from yahoo, number in Rupees or null>,
            "target_price_low": <from yahoo or extract, number in Rupees or null>,
            "target_price_high": <from yahoo or extract, number in Rupees or null>,
            "target_price_avg": <from yahoo or extract, number in Rupees or null>,
            "volatility": <calculate: "high" if beta > 1.5 or wide range, else "moderate" or "low">,
            "beta": <from yahoo or extract, number or null>,
            "52_week_high": <from yahoo or extract, number in Rupees or null>,
            "52_week_low": <from yahoo or extract, number in Rupees or null>,
            "negative_news_found": <true if negative news found, else false>,
            "negative_news_summary": "<summary if any negative news found>",
            "speculative_zone": <true if beta > 1.5 OR 52-week range > 50% of current price, else false>,
            "technical_verdict": <"bullish" if price > MA200 and MA50 > MA200, "bearish" if opposite, "neutral" otherwise>
        }}
        
        IMPORTANT: Use the REAL DATA FROM YAHOO FINANCE values whenever they are available (not null)!
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": analysis_prompt}]
        )
        
        tech_data_web = json.loads(response.choices[0].message.content)
        
        # Merge: Yahoo data takes precedence, web search fills gaps
        tech_data = {**tech_data_web}  # Start with web search data
        for key, value in tech_data_from_yahoo.items():
            if value is not None:  # Only override if Yahoo has real data
                tech_data[key] = value
        
        print(f"✅ Merged Yahoo Finance data with web search results")
        
        # =====================================================================
        # RULE-BASED RISK FLAGS (NOT LLM OPINION!)
        # =====================================================================
        
        rsi_value = tech_data.get("rsi_value")
        rsi_status = tech_data.get("rsi_status", "unknown")
        pe_ratio = tech_data.get("pe_ratio")
        pe_status = tech_data.get("pe_status", "unknown")
        
        # Check RSI warnings
        if rsi_status == "overbought" or (rsi_value and rsi_value > 70):
            is_overbought = True
            risk_warnings.append("⚠️ **OVERBOUGHT (RSI > 70)** - Stock may be due for correction. Wait for pullback before buying.")
            print(f"🚨 RSI WARNING: Overbought detected!")
        
        if rsi_status == "oversold" or (rsi_value and rsi_value < 30):
            is_oversold = True
            risk_warnings.append("🟢 **OVERSOLD (RSI < 30)** - Stock may be undervalued. Potential buying opportunity.")
            print(f"✅ RSI: Oversold - potential opportunity")
        
        # Check P/E ratio warnings
        if pe_status == "expensive" or (pe_ratio and pe_ratio > 40):
            risk_warnings.append("💰 **EXPENSIVE VALUATION (P/E > 40)** - Stock is trading at high valuation. Price in a lot of growth.")
            print(f"💰 P/E WARNING: Expensive valuation!")
        
        # Check negative news (CRITICAL!)
        if tech_data.get("negative_news_found"):
            has_negative_news = True
            news_summary = tech_data.get("negative_news_summary", "Negative news detected")
            risk_warnings.append(f"🚨 **NEGATIVE NEWS ALERT** - {news_summary}")
            risk_warnings.append("⛔ **AVOID NOW** - Do not invest until situation clarifies!")
            print(f"🚨 NEGATIVE NEWS DETECTED!")
        
        # Check speculative zone
        if tech_data.get("speculative_zone") or tech_data.get("volatility") == "high":
            is_speculative = True
            risk_warnings.append("⚡ **SPECULATIVE ZONE** - High volatility/beta. Only for aggressive investors.")
            print(f"⚡ SPECULATIVE ZONE detected!")
        
        # Format price with ₹ symbol
        def format_rupee(val):
            if val is None or val == "N/A":
                return "N/A"
            try:
                return f"₹{float(val):,.2f}"
            except:
                return f"₹{val}"
        
        # Build technical analysis summary with BEGINNER-FRIENDLY explanations
        technical_summary = f"""
**📈 Technical Analysis for {company}**

---

**📊 Key Indicators (with Beginner Explanations)**

| Indicator | Value | What it Means |
|-----------|-------|---------------|
| **RSI (14-day)** | {rsi_value if rsi_value else 'N/A'} ({rsi_status.upper()}) | *RSI measures if stock is oversold (<30) or overbought (>70). Think of it like a "popularity meter" - if everyone is buying (>70), it might be too hot!* |
| **P/E Ratio** | {pe_ratio if pe_ratio else 'N/A'} ({pe_status.upper()}) | *Price-to-Earnings shows how many years of earnings you're paying for. P/E of 20 means you pay ₹20 for ₹1 of profit. Lower is usually cheaper.* |
| **Industry P/E** | {tech_data.get('industry_pe', 'N/A')} | *Compare company P/E to this. If company P/E > industry P/E, stock is relatively expensive.* |
| **EPS** | {format_rupee(tech_data.get('eps'))} | *Earnings Per Share - profit per share. Higher EPS = more profitable.* |

---

**📉 Moving Averages & Support/Resistance**

| Level | Price | Meaning |
|-------|-------|---------|
| **50-Day MA** | {format_rupee(tech_data.get('moving_avg_50'))} | *Short-term trend. If stock price > 50-day MA, short-term bullish.* |
| **200-Day MA** | {format_rupee(tech_data.get('moving_avg_200'))} | *Long-term trend. If stock price > 200-day MA, long-term bullish.* |
| **Support Level** | {format_rupee(tech_data.get('support_level'))} | *Price floor - stock tends to bounce up from here.* |
| **Resistance Level** | {format_rupee(tech_data.get('resistance_level'))} | *Price ceiling - stock struggles to go above this.* |

---

**🎯 Analyst Target Price (in ₹)**

| Target | Price |
|--------|-------|
| **Low Target** | {format_rupee(tech_data.get('target_price_low'))} |
| **Average Target** | {format_rupee(tech_data.get('target_price_avg'))} |
| **High Target** | {format_rupee(tech_data.get('target_price_high'))} |

*Analysts study companies and predict where stock price might go. These are their estimates.*

---

**⚡ Volatility & Risk Metrics**

| Metric | Value | Meaning |
|--------|-------|---------|
| **Volatility** | {tech_data.get('volatility', 'Unknown').upper()} | *How much price swings. HIGH = risky but potential for big gains.* |
| **Beta** | {tech_data.get('beta', 'N/A')} | *Beta=1 means moves like market. Beta>1 = more volatile than market. Beta<1 = less volatile.* |
| **52-Week Range** | {format_rupee(tech_data.get('52_week_low'))} - {format_rupee(tech_data.get('52_week_high'))} | *Lowest and highest price in last 1 year.* |

---

**🔮 Technical Verdict: {tech_data.get('technical_verdict', 'neutral').upper()}**
"""
        
        # Add risk warnings section if any
        if risk_warnings:
            technical_summary += "\n\n---\n\n**🚨 RISK WARNINGS**\n\n"
            for warning in risk_warnings:
                technical_summary += f"{warning}\n\n"
        else:
            technical_summary += "\n\n✅ **No major risk flags detected**"
        
        print(f"✅ Technical Analysis Complete")
        
        # NOTE: Don't add to messages here - only final node adds the combined message
        return {
            "technical_analysis": technical_summary,
            "risk_warnings": risk_warnings,
            "is_overbought": is_overbought,
            "is_oversold": is_oversold,
            "has_negative_news": has_negative_news,
            "is_speculative": is_speculative
        }
        
    except Exception as e:
        print(f"❌ Error in technical analysis: {e}")
        return {
            "technical_analysis": "Technical analysis not available.",
            "risk_warnings": [],
            "is_overbought": False,
            "is_oversold": False,
            "has_negative_news": False,
            "is_speculative": False
        }


# =============================================================================
#                     NODE 7: INVESTMENT SUGGESTION (ENHANCED!)
# =============================================================================

def investment_suggestion_node(state: StockResearchState) -> Dict[str, Any]:
    """
    📖 Node 7: Investment Suggestion 💡
    ===================================
    
    GOAL: Provide actionable investment recommendation WITH RISK AWARENESS.
    
    WHAT IT DOES:
    1. Combines all previous analysis INCLUDING technical + risk warnings
    2. Gives buy/sell/hold recommendation
    3. RESPECTS RISK FLAGS - If overbought/negative news → Warns strongly!
    4. Suggests quantity based on risk profile
    5. Recommends long-term vs short-term
    6. Adds important disclaimer
    
    📌 ENHANCED: Now uses risk flags from technical_analysis_node!
    - If has_negative_news → Strong AVOID recommendation
    - If is_overbought → Warn to wait for correction
    - If is_speculative → Only recommend for aggressive investors
    """
    print("\n" + "="*60)
    print("💡 NODE 7: INVESTMENT SUGGESTION")
    print("="*60)
    
    company = state.get("company_name", state["query"])
    company_intro = state.get("company_intro", "")
    sector_analysis = state.get("sector_analysis", "")
    company_research = state.get("company_research", "")
    policy_analysis = state.get("policy_analysis", "")
    investor_sentiment = state.get("investor_sentiment", "")
    technical_analysis = state.get("technical_analysis", "")
    current_date = state.get("current_date", "")
    
    # Get risk flags from technical analysis
    risk_warnings = state.get("risk_warnings", [])
    is_overbought = state.get("is_overbought", False)
    is_oversold = state.get("is_oversold", False)
    has_negative_news = state.get("has_negative_news", False)
    is_speculative = state.get("is_speculative", False)
    
    print(f"📌 Generating investment suggestion for: {company}")
    
    try:
        # Build risk context for the prompt
        risk_context = ""
        if has_negative_news:
            risk_context += "\n🚨 CRITICAL: NEGATIVE NEWS DETECTED - Must strongly warn against buying!\n"
        if is_overbought:
            risk_context += "\n⚠️ WARNING: Stock is OVERBOUGHT (RSI > 70) - Wait for correction!\n"
        if is_speculative:
            risk_context += "\n⚡ ALERT: SPECULATIVE ZONE - High volatility, only for aggressive investors!\n"
        if is_oversold:
            risk_context += "\n🟢 NOTE: Stock is OVERSOLD (RSI < 30) - Potential buying opportunity!\n"
        
        suggestion_prompt = f"""
        You are a senior investment advisor with STRICT RISK MANAGEMENT.
        
        Based on ALL the research below, provide a comprehensive INVESTMENT SUGGESTION for {company}.
        
        Company: {company}
        Date: {current_date}
        
        === RISK FLAGS (CRITICAL - MUST ADDRESS!) ===
        {risk_context if risk_context else "No major risk flags detected."}
        
        Risk Warnings: {risk_warnings if risk_warnings else "None"}
        
        === COMPANY INTRODUCTION ===
        {company_intro}
        
        === SECTOR ANALYSIS ===
        {sector_analysis}
        
        === COMPANY RESEARCH ===
        {company_research}
        
        === POLICY ANALYSIS ===
        {policy_analysis}
        
        === INVESTOR SENTIMENT ===
        {investor_sentiment}
        
        === TECHNICAL ANALYSIS ===
        {technical_analysis}
        
        ===========================
        
        **IMPORTANT RULES:**
        1. If NEGATIVE NEWS was detected → Recommend AVOID/DO NOT BUY
        2. If OVERBOUGHT → Recommend WAIT for correction before buying
        3. If SPECULATIVE ZONE → Only recommend for aggressive investors with stop-loss
        4. If OVERSOLD → Can recommend as potential opportunity
        
        Provide a DETAILED INVESTMENT SUGGESTION with:
        
        **💡 Investment Recommendation**
        
        🎯 **Action:** [BUY / SELL / HOLD / WAIT]
        
        📊 **Investment Horizon:**
        - **Short-term (< 6 months):** [Suitable? Yes/No with reason]
        - **Medium-term (6-18 months):** [Suitable? Yes/No with reason]
        - **Long-term (> 18 months):** [Suitable? Yes/No with reason]
        
        💰 **Suggested Investment Strategy:**
        - **For Conservative Investors:** [suggestion with quantity hint]
        - **For Moderate Risk Takers:** [suggestion with quantity hint]
        - **For Aggressive Investors:** [suggestion with quantity hint]
        
        📈 **Entry Strategy:**
        - Current Price Level: [good entry / wait for dip / expensive]
        - Suggested Entry Range: [if available from research]
        
        ⚠️ **Risk Factors to Watch:**
        - [Key risk 1]
        - [Key risk 2]
        - [Key risk 3]
        
        🎓 **Final Verdict:**
        [2-3 sentence clear conclusion on whether to invest and how]
        
        ---
        
        ⚠️ **IMPORTANT DISCLAIMER:**
        This analysis is for educational purposes only and NOT financial advice. 
        Stock market investments are subject to market risks. Please:
        - Do your own thorough research (DYOR)
        - Consult a SEBI-registered financial advisor
        - Never invest more than you can afford to lose
        - Don't treat investing like gambling
        
        💬 **Follow-up:** Would you like me to analyze any specific aspect in more detail?
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": suggestion_prompt}]
        )
        
        investment_suggestion = response.choices[0].message.content
        
        # Combine everything for final recommendation
        # ORDER: Company Intro → Sector → Research → Policy → Sentiment → Technical → Suggestion
        # NO DUPLICATES - each section appears ONCE
        final_recommendation = f"""
# 📊 Complete Stock Analysis: {company}

---

## 🏢 Company Introduction
*Who is this company? What do they do?*

{company_intro if company_intro else "Company information not available."}

---

## 🏭 Sector Analysis
*What industry are they in? How's the sector doing?*

{sector_analysis if sector_analysis else "Sector analysis not available."}

---

## 🕵️ Company Research
*Recent financials, news, and performance*

{company_research if company_research else "Company research not available."}

---

## ⚖️ Policy Analysis
*Government policies and regulations impacting the company*

{policy_analysis if policy_analysis else "No major policy impacts identified."}

---

## 📊 Investor Sentiment
*What are analysts and investors saying?*

{investor_sentiment if investor_sentiment else "Sentiment data not available."}

---

## 📈 Technical Analysis & Risk Check
*Key indicators, valuations, and risk warnings*

{technical_analysis if technical_analysis else "Technical analysis not available."}

---

## 💡 Investment Suggestion
*Based on ALL the above analysis, here's the recommendation:*

{investment_suggestion}
"""
        
        print(f"✅ Investment Suggestion Complete")
        print("="*60)
        
        return {
            "investment_suggestion": investment_suggestion,
            "final_recommendation": final_recommendation,
            "messages": [{
                "role": "assistant",
                "content": f"📈 **{company} Complete Stock Analysis**\n\n{final_recommendation}"
            }]
        }
        
    except Exception as e:
        print(f"❌ Error generating investment suggestion: {e}")
        error_response = f"""
        Sorry, I couldn't generate a complete suggestion due to an error.
        
        ⚠️ **Disclaimer**: This is not financial advice. Please do your own research.
        """
        return {
            "investment_suggestion": error_response,
            "final_recommendation": error_response,
            "messages": [{"role": "assistant", "content": error_response}]
        }


# =============================================================================
#                     NODE 7: FINAL ADVISOR (Summary)
# =============================================================================

def final_advisor_node(state: StockResearchState) -> Dict[str, Any]:
    """
    📖 Node 7: Final Advisor 🎓
    ===========================
    
    GOAL: This node now just passes through - all work done in investment_suggestion_node
    """
    print("\n" + "="*60)
    print("🎓 NODE 7: FINAL ADVISOR (Pass-through)")
    print("="*60)
    
    # All work already done in investment_suggestion_node
    # Just return state as-is
    return {
        "messages": state.get("messages", [])
    }


# =============================================================================
#                     BUILD THE GRAPH
# =============================================================================
"""
📖 Building the LangGraph
=========================

Now we connect all the nodes together!

🔗 In your notes (07-LangGraph/graph.py):
    graph_builder = StateGraph(State)
    graph_builder.add_node("chat_node", chat_node)
    graph_builder.add_edge(START, "chat_node")
    graph_builder.add_edge("chat_node", END)

We do the same, but with 4 nodes in sequence!
"""

# Create the graph builder with our State
graph_builder = StateGraph(StockResearchState)
"""
📖 StateGraph(StockResearchState)
---------------------------------
Creates a new graph that uses StockResearchState as its data structure.
Every node will receive and return this state.
"""

# Add all nodes (7-Node Stock Research Workflow)
graph_builder.add_node("company_intro", company_intro_node)             # Node 1
graph_builder.add_node("sector_analyst", sector_analyst_node)           # Node 2
graph_builder.add_node("company_researcher", company_researcher_node)   # Node 3
graph_builder.add_node("policy_watchdog", policy_watchdog_node)         # Node 4
graph_builder.add_node("investor_sentiment", investor_sentiment_node)   # Node 5
graph_builder.add_node("technical_analysis", technical_analysis_node)   # Node 6
graph_builder.add_node("investment_suggestion", investment_suggestion_node)  # Node 7
"""
📖 Stock Research Workflow (7 Nodes!)
----------------------------------------------
1. Company Intro: What the company does, activities, locations
2. Sector Analyst: Uses intro to identify sector & trends
3. Company Researcher: Financials and news from trusted sources
4. Policy Watchdog: Government policies impact
5. Investor Sentiment: Market sentiment & analyst ratings
6. Technical Analysis: RSI, moving averages, RISK WARNINGS! ⚠️
7. Investment Suggestion: Buy/sell/hold with risk-aware recommendation
"""

# Add edges (the flow)
graph_builder.add_edge(START, "company_intro")
graph_builder.add_edge("company_intro", "sector_analyst")
graph_builder.add_edge("sector_analyst", "company_researcher")
graph_builder.add_edge("company_researcher", "policy_watchdog")
graph_builder.add_edge("policy_watchdog", "investor_sentiment")
graph_builder.add_edge("investor_sentiment", "technical_analysis")
graph_builder.add_edge("technical_analysis", "investment_suggestion")
graph_builder.add_edge("investment_suggestion", END)
"""
📖 Enhanced Flow (7 Nodes with Risk Sentinel!):
-----------------------------------------------
START → company_intro → sector_analyst → company_researcher → 
        policy_watchdog → investor_sentiment → technical_analysis → 
        investment_suggestion → END

This provides COMPREHENSIVE stock analysis with RISK PROTECTION:
1. First understand the company (intro)
2. Then analyze sector (using intro for accurate sector identification)
3. Research company financials from trusted sources
4. Check policy impacts
5. Analyze investor sentiment
6. 📈 TECHNICAL ANALYSIS + RISK WARNINGS (RSI, overbought, negative news!)
7. Finally give risk-aware investment suggestion
"""

# Compile the graph
stock_research_graph = graph_builder.compile()
"""
📖 compile()
------------
Finalizes the graph and makes it ready to run.
After this, you can call: graph.invoke(state)

🔗 In your notes:
    def compile_graph_with_checkpointer(checkpointer):
        graph_with_checkpointer = graph_builder.compile(checkpointer=checkpointer)
        return graph_with_checkpointer
"""


# =============================================================================
#                     DETECT QUERY TYPE (Company vs Sector)
# =============================================================================

def detect_query_type(query: str) -> Dict[str, Any]:
    """
    📖 Detect Query Type: Company vs Sector
    =======================================
    
    Determines if the query is about:
    - A specific company (e.g., "Tata Motors stock", "HDFC Bank")
    - A sector/industry (e.g., "Defence shares", "IT sector", "Banking stocks")
    
    Returns:
    --------
    {
        "type": "company" | "sector",
        "entity": "company name" or "sector name",
        "confidence": float (0.0 to 1.0)
    }
    """
    query_lower = query.lower()
    
    # Sector keywords (Indian stock market sectors)
    sector_keywords = {
        "defence": ["defence", "defense", "aerospace"],
        "it": ["it sector", "information technology", "software", "tech sector"],
        "banking": ["banking", "banks", "financial sector", "finance"],
        "pharma": ["pharma", "pharmaceutical", "medicine", "drug"],
        "auto": ["auto", "automobile", "automotive", "car", "vehicle"],
        "fmcg": ["fmcg", "fast moving", "consumer goods"],
        "energy": ["energy", "power", "oil", "gas", "renewable"],
        "real estate": ["real estate", "realty", "construction", "infrastructure"],
        "telecom": ["telecom", "telecommunication"],
        "steel": ["steel", "metal", "iron"],
        "cement": ["cement", "construction material"]
    }
    
    # Specific company indicators (strong signals)
    company_indicators = [
        "tata motors", "reliance", "hdfc", "infosys", "tcs", "wipro", 
        "icici", "sbi", "bajaj", "mahindra", "maruti", "adani",
        "hindustan aeronautics", "bharat electronics", "hal", "bel",
        "ntpc", "ongc", "sail", "bhel", "coal india"
    ]
    
    # Check for specific company mentions
    for company in company_indicators:
        if company in query_lower:
            return {
                "type": "company",
                "entity": company.title(),
                "confidence": 0.9
            }
    
    # Check for sector mentions
    for sector, keywords in sector_keywords.items():
        for keyword in keywords:
            if keyword in query_lower:
                # Check if it's a sector-level question (not a company)
                sector_patterns = [
                    f"{keyword} share", f"{keyword} shares", f"{keyword} stock", 
                    f"{keyword} stocks", f"{keyword} sector", f"{keyword} industry",
                    f"buy {keyword}", f"invest in {keyword}", f"{keyword} companies"
                ]
                for pattern in sector_patterns:
                    if pattern in query_lower:
                        return {
                            "type": "sector",
                            "entity": sector.title(),
                            "confidence": 0.85
                        }
    
    # Default: assume company (for backward compatibility)
    return {
        "type": "company",
        "entity": None,
        "confidence": 0.5
    }


# =============================================================================
#                     SECTOR ANALYSIS WORKFLOW (4 NODES)
# =============================================================================

def sector_general_overview_node(sector_name: str, query: str) -> Dict[str, Any]:
    """
    📖 Node 1: General Overview (Based on Current News)
    """
    print("\n" + "="*60)
    print("📰 NODE 1: GENERAL OVERVIEW (Current News)")
    print("="*60)
    
    date_info = get_current_datetime()
    current_date = date_info.get("formatted", "")
    
    print(f"📌 Analyzing {sector_name} sector overview")
    
    try:
        # Search for latest sector news
        news_query = f"{sector_name} sector India latest news 2024"
        news_results = search_news(news_query, max_results=5)
        
        # Search for sector trends
        trends_query = f"{sector_name} sector India 2024 trends growth outlook"
        trends_results = smart_web_search(trends_query, max_results=5)
        
        # Generate general overview
        overview_prompt = f"""
        You are a financial analyst specializing in Indian stock markets.
        
        User Query: "{query}"
        Sector: {sector_name}
        Current Date: {current_date}
        
        LATEST NEWS:
        {json.dumps(news_results.get('results', [])[:5], indent=2)}
        
        SECTOR TRENDS:
        {json.dumps(trends_results.get('results', [])[:5], indent=2)}
        
        Provide a comprehensive GENERAL OVERVIEW covering:
        
        **📰 General Overview - {sector_name} Sector**
        
        1. **Current State:** What's happening in this sector right now?
        2. **Recent Developments:** Key news and events
        3. **Growth Drivers:** What factors are driving growth or decline?
        
        Keep it informative and concise (200 words).
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": overview_prompt}]
        )
        
        general_overview = response.choices[0].message.content
        print(f"✅ General Overview Complete")
        
        return {"general_overview": general_overview}
        
    except Exception as e:
        print(f"❌ Error in general overview: {e}")
        return {"general_overview": f"General overview for {sector_name} sector is currently unavailable."}


def sector_investor_sentiment_node(sector_name: str, general_overview: str) -> Dict[str, Any]:
    """
    📖 Node 2: Investor Sentiment
    """
    print("\n" + "="*60)
    print("📊 NODE 2: INVESTOR SENTIMENT")
    print("="*60)
    
    print(f"📌 Analyzing investor sentiment for {sector_name} sector")
    
    try:
        sentiment_query = f"{sector_name} sector India investor sentiment analyst outlook 2024"
        sentiment_results = smart_web_search(sentiment_query, max_results=5)
        
        sentiment_prompt = f"""
        Based on the following data, provide an INVESTOR SENTIMENT analysis for the {sector_name} sector in India.
        
        GENERAL OVERVIEW:
        {general_overview[:500]}
        
        INVESTOR SENTIMENT DATA:
        {json.dumps(sentiment_results.get("results", [])[:5], indent=2)}
        
        Provide:
        
        **📊 Investor Sentiment - {sector_name} Sector**
        
        🎯 **Overall Sentiment:** [Bullish 🟢 / Bearish 🔴 / Neutral 🟡]
        
        📈 **Analyst Outlook:** What are analysts saying?
        
        🏛️ **Institutional Interest:** FII/DII flows
        
        ⚡ **Sentiment Score:** [1-10] with brief justification
        
        Keep it concise (150 words).
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": sentiment_prompt}]
        )
        
        investor_sentiment = response.choices[0].message.content
        print(f"✅ Investor Sentiment Analysis Complete")
        
        return {"investor_sentiment": investor_sentiment}
        
    except Exception as e:
        print(f"❌ Error in investor sentiment: {e}")
        return {"investor_sentiment": f"Investor sentiment data for {sector_name} sector is not available."}


def sector_technical_analysis_node(sector_name: str, general_overview: str, investor_sentiment: str) -> Dict[str, Any]:
    """
    📖 Node 3: Technical Analysis & Risk Check
    """
    print("\n" + "="*60)
    print("📈 NODE 3: TECHNICAL ANALYSIS & RISK CHECK")
    print("="*60)
    
    print(f"📌 Technical analysis for {sector_name} sector")
    risk_warnings = []
    
    try:
        valuation_query = f"{sector_name} sector India P/E ratio valuation overvalued undervalued"
        valuation_results = smart_web_search(valuation_query, max_results=3)
        
        risks_query = f"{sector_name} sector India risks challenges 2024"
        risks_results = smart_web_search(risks_query, max_results=3)
        
        tech_prompt = f"""
        Provide a technical analysis and risk assessment for the {sector_name} sector in India.
        All prices must be in ₹ (Rupees).
        
        VALUATION DATA:
        {json.dumps(valuation_results.get("results", [])[:3], indent=2)}
        
        SECTOR RISKS:
        {json.dumps(risks_results.get("results", [])[:3], indent=2)}
        
        Provide:
        
        **📈 Technical Analysis - {sector_name} Sector**
        
        💰 **Valuation:** Is the sector overvalued or undervalued?
        
        ⚠️ **Risk Assessment:** Key risks facing this sector
        
        🚨 **Risk Warnings:** Any critical warnings
        
        Keep it concise (200 words).
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": tech_prompt}]
        )
        
        technical_analysis = response.choices[0].message.content
        
        if "overvalued" in technical_analysis.lower():
            risk_warnings.append("⚠️ Sector appears overvalued")
        
        print(f"✅ Technical Analysis Complete")
        
        return {"technical_analysis": technical_analysis, "risk_warnings": risk_warnings}
        
    except Exception as e:
        print(f"❌ Error in technical analysis: {e}")
        return {"technical_analysis": f"Technical analysis for {sector_name} sector is not available.", "risk_warnings": []}


def sector_investment_suggestion_node(sector_name: str, query: str, general_overview: str, investor_sentiment: str, technical_analysis: str, risk_warnings: list) -> Dict[str, Any]:
    """
    📖 Node 4: Investment Suggestion
    """
    print("\n" + "="*60)
    print("💡 NODE 4: INVESTMENT SUGGESTION")
    print("="*60)
    
    print(f"📌 Generating investment suggestion for {sector_name} sector")
    
    try:
        companies_query = f"top {sector_name} companies India NSE BSE listed stocks best"
        companies_results = smart_web_search(companies_query, max_results=5)
        
        suggestion_prompt = f"""
        You are a financial advisor for Indian stock markets.
        
        User Query: "{query}"
        Sector: {sector_name}
        
        Based on the analysis:
        
        **GENERAL OVERVIEW:**
        {general_overview}
        
        **INVESTOR SENTIMENT:**
        {investor_sentiment}
        
        **TECHNICAL ANALYSIS:**
        {technical_analysis}
        
        **RISK WARNINGS:**
        {', '.join(risk_warnings) if risk_warnings else 'None'}
        
        **TOP COMPANIES:**
        {json.dumps(companies_results.get('results', [])[:5], indent=2)}
        
        Provide:
        
        **💡 Investment Suggestion - {sector_name} Sector**
        
        🎯 **Recommendation:** [BUY / HOLD / AVOID / CAUTIOUS]
        
        ✅ **Reasons to Invest:** List positive factors
        
        ⚠️ **Reasons to Be Cautious:** List concerns
        
        🏢 **Top Companies to Consider:** List 3-5 top companies
        
        💰 **Investment Strategy:** How to approach this sector
        
        End with: "⚠️ This is not financial advice. Please do your own research before investing."
        
        Keep it comprehensive (300 words).
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": suggestion_prompt}]
        )
        
        investment_suggestion = response.choices[0].message.content
        print(f"✅ Investment Suggestion Complete")
        
        return {"investment_suggestion": investment_suggestion}
        
    except Exception as e:
        print(f"❌ Error in investment suggestion: {e}")
        return {"investment_suggestion": f"Investment suggestion for {sector_name} sector is currently unavailable."}


def run_sector_analysis(sector_name: str, query: str) -> Dict[str, Any]:
    """
    📖 Run Sector-Level Analysis (4-Node Workflow)
    ==============================================
    
    For sector-level queries (e.g., "Defence shares", "IT sector")
    """
    print("\n" + "="*60)
    print(f"🏭 SECTOR ANALYSIS WORKFLOW: {sector_name}")
    print("="*60)
    
    # Node 1: General Overview
    node1_result = sector_general_overview_node(sector_name, query)
    general_overview = node1_result.get("general_overview", "")
    
    # Node 2: Investor Sentiment
    node2_result = sector_investor_sentiment_node(sector_name, general_overview)
    investor_sentiment = node2_result.get("investor_sentiment", "")
    
    # Node 3: Technical Analysis & Risk Check
    node3_result = sector_technical_analysis_node(sector_name, general_overview, investor_sentiment)
    technical_analysis = node3_result.get("technical_analysis", "")
    risk_warnings = node3_result.get("risk_warnings", [])
    
    # Node 4: Investment Suggestion
    node4_result = sector_investment_suggestion_node(
        sector_name, query, general_overview, investor_sentiment, 
        technical_analysis, risk_warnings
    )
    investment_suggestion = node4_result.get("investment_suggestion", "")
    
    # Combine all results
    final_recommendation = f"""
# 🏭 {sector_name} Sector Analysis

---

## 📰 General Overview
{general_overview}

---

## 📊 Investor Sentiment
{investor_sentiment}

---

## 📈 Technical Analysis & Risk Check
{technical_analysis}

---

## 💡 Investment Suggestion
{investment_suggestion}
"""
    
    return {
        "type": "sector_analysis",
        "sector": sector_name,
        "query": query,
        "general_overview": general_overview,
        "investor_sentiment": investor_sentiment,
        "technical_analysis": technical_analysis,
        "investment_suggestion": investment_suggestion,
        "risk_warnings": risk_warnings,
        "final_recommendation": final_recommendation,
        "steps": [
            {"step": "general_overview", "status": "complete"},
            {"step": "investor_sentiment", "status": "complete"},
            {"step": "technical_analysis", "status": "complete"},
            {"step": "investment_suggestion", "status": "complete"}
        ]
    }


# =============================================================================
#                     RUN FUNCTION (WITH SMART ROUTING)
# =============================================================================

def run_stock_research(query: str, company_name: Optional[str] = None) -> Dict[str, Any]:
    """
    📖 Run Stock Research (with Smart Routing)
    ==========================================
    
    Main function to run the stock research workflow.
    Now includes smart routing to distinguish between:
    - Company-specific queries → Full LangGraph workflow
    - Sector-level queries → Simplified sector analysis
    
    Parameters:
    -----------
    query: The user's question (e.g., "Tell me about Tata Motors stock" or "Defence shares")
    company_name: Optional explicit company name
    
    Returns:
    --------
    Dict with final_recommendation and all intermediate findings
    
    📌 EXAMPLE USAGE:
    ----------------
    result = run_stock_research("Tell me about Reliance stock")  # Company
    result = run_stock_research("Should I buy Defence shares?")  # Sector
    """
    print("\n" + "="*60)
    print("🚀 STARTING STOCK RESEARCH (with Smart Routing)")
    print("="*60)
    print(f"📌 Query: {query}")
    
    # Step 1: Detect query type (company vs sector)
    query_type_info = detect_query_type(query)
    print(f"🎯 Detected Type: {query_type_info['type']} ({query_type_info['entity']})")
    print(f"   Confidence: {query_type_info['confidence']}")
    
    # Step 2: Route to appropriate workflow
    if query_type_info['type'] == 'sector' and query_type_info['confidence'] > 0.7:
        # Sector-level query → Use simplified sector analysis
        print("🏭 Routing to Sector Analysis (4-node workflow)")
        return run_sector_analysis(query_type_info['entity'], query)
    
    # Company-specific query → Use full LangGraph workflow
    print("🏢 Routing to Company Research (full LangGraph workflow)")
    
    # Extract company name from query if not provided
    if not company_name:
        # Use LLM to extract company name accurately
        extract_prompt = f"""
        Extract the INDIAN company or stock name from this query:
        "{query}"
        
        IMPORTANT: This is for INDIAN stocks only (NSE/BSE).
        Return the FULL INDIAN company name.
        
        Examples:
        - "Tell me about Reliance stock" → Reliance Industries Limited
        - "Suggest me the reliance share future" → Reliance Industries Limited
        - "Tata Motors analysis" → Tata Motors Limited
        - "How is HDFC Bank doing" → HDFC Bank Limited
        - "Infosys stock price" → Infosys Limited
        - "HAL stock" → Hindustan Aeronautics Limited  ← NOT Halliburton!
        - "BEL share" → Bharat Electronics Limited
        - "TCS analysis" → Tata Consultancy Services
        - "SBI stock" → State Bank of India
        - "ICICI Bank" → ICICI Bank Limited
        
        RULES:
        1. HAL = Hindustan Aeronautics Limited (NOT Halliburton)
        2. BEL = Bharat Electronics Limited
        3. SAIL = Steel Authority of India Limited
        4. ONGC = Oil and Natural Gas Corporation
        5. NTPC = NTPC Limited
        6. BHEL = Bharat Heavy Electricals Limited
        
        Return ONLY the full Indian company name, nothing else.
        If no specific company is mentioned, return "Unknown".
        """
        
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": extract_prompt}],
                max_tokens=50
            )
            company_name = response.choices[0].message.content.strip()
            # Clean up quotes if any
            company_name = company_name.strip('"\'')
        except:
            # Fallback to simple extraction
            words = query.split()
            common_words = ["tell", "me", "about", "what", "is", "the", "stock", "share", 
                           "suggest", "how", "future", "price", "analysis", "give", 
                           "show", "check", "find", "get", "of", "for", "a", "an"]
            company_words = []
            for word in words:
                if word.lower() not in common_words and len(word) > 2:
                    company_words.append(word.capitalize())
            company_name = " ".join(company_words[:2]) if company_words else query
    
    print(f"📌 Company: {company_name}")
    
    # Create initial state (Enhanced with 7-node workflow + risk flags!)
    initial_state = {
        "messages": [{"role": "user", "content": query}],
        "query": query,
        "company_name": company_name,
        # Node outputs
        "company_intro": None,
        "sector_analysis": None,
        "company_research": None,
        "policy_analysis": None,
        "investor_sentiment": None,
        "technical_analysis": None,  # NEW!
        "investment_suggestion": None,
        "final_recommendation": None,
        # Risk flags from technical analysis
        "risk_warnings": [],
        "is_overbought": False,
        "is_oversold": False,
        "has_negative_news": False,
        "is_speculative": False,
        # Metadata
        "current_date": None,
        "search_results": None
    }
    
    # Run the graph
    try:
        final_state = stock_research_graph.invoke(initial_state)
        
        print("\n" + "="*60)
        print("✅ ENHANCED WORKFLOW COMPLETE! (7 Nodes with Risk Sentinel)")
        print("="*60)
        
        return {
            "query": query,
            "company_name": company_name,
            # Enhanced response with all 7 node outputs
            "company_intro": final_state.get("company_intro"),
            "sector_analysis": final_state.get("sector_analysis"),
            "company_research": final_state.get("company_research"),
            "policy_analysis": final_state.get("policy_analysis"),
            "investor_sentiment": final_state.get("investor_sentiment"),
            "technical_analysis": final_state.get("technical_analysis"),  # NEW!
            "investment_suggestion": final_state.get("investment_suggestion"),
            "final_recommendation": final_state.get("final_recommendation"),
            # Risk flags
            "risk_warnings": final_state.get("risk_warnings", []),
            "is_overbought": final_state.get("is_overbought", False),
            "has_negative_news": final_state.get("has_negative_news", False),
            "is_speculative": final_state.get("is_speculative", False),
            "messages": final_state.get("messages", [])
        }
        
    except Exception as e:
        print(f"❌ Workflow error: {e}")
        return {
            "error": str(e),
            "query": query,
            "company_name": company_name
        }


# =============================================================================
#                     MAIN (FOR TESTING)
# =============================================================================

if __name__ == "__main__":
    """
    📖 Test the workflow directly
    -----------------------------
    Run: python3 stock_graph.py
    """
    print("🧪 Testing Stock Research Workflow...")
    
    result = run_stock_research("Tell me about Tata Motors stock")
    
    print("\n" + "="*60)
    print("📊 FINAL RESULT")
    print("="*60)
    print(result.get("final_recommendation", "No recommendation"))


"""
===================================================================================
                        SUMMARY: STOCK_GRAPH.PY (WITH SMART ROUTING!)
===================================================================================

This file implements the SHARE MARKET RESEARCH WORKFLOW using LangGraph.

🔗 EXACTLY LIKE YOUR NOTES (07-LangGraph/graph.py)!

📌 SMART ROUTING - DETECTS QUERY TYPE:
--------------------------------------
- "Tell me about Tata Motors" → Company Analysis (7-node workflow)
- "Should I buy defence shares?" → Sector Analysis (4-node workflow)

📌 COMPANY WORKFLOW (7 NODES WITH RISK PROTECTION!):
----------------------------------------------------
1. company_intro_node        → Company overview, activities, locations
2. sector_analyst_node       → Sector trends (uses intro for accurate sector ID!)
3. company_researcher_node   → Financials from trusted sources
4. policy_watchdog_node      → Government policies impact
5. investor_sentiment_node   → Market sentiment, analyst ratings, FII/DII
6. technical_analysis_node   → RSI, Moving Averages, RISK WARNINGS! ⚠️
7. investment_suggestion_node → RISK-AWARE buy/sell/hold recommendation

📌 SECTOR WORKFLOW (4 NODES - NEW!):
------------------------------------
1. sector_general_overview_node   → Current news and sector state
2. sector_investor_sentiment_node → FII/DII flows, analyst outlook
3. sector_technical_analysis_node → Valuation, risks, warnings
4. sector_investment_suggestion_node → Recommendation + top companies

COMPANY GRAPH FLOW:
-------------------
    START → company_intro → sector_analyst → company_researcher → 
            policy_watchdog → investor_sentiment → technical_analysis →
            investment_suggestion → END

SECTOR GRAPH FLOW:
------------------
    START → general_overview → investor_sentiment → technical_analysis →
            investment_suggestion → END

STATE (StockResearchState):
---------------------------
- messages: Conversation history
- query: User's original question
- company_name: The company being researched
- company_intro: Output from Node 1
- sector_analysis: Output from Node 2
- company_research: Output from Node 3
- policy_analysis: Output from Node 4
- investor_sentiment: Output from Node 5
- technical_analysis: Output from Node 6 (NEW!)
- investment_suggestion: Output from Node 7
- final_recommendation: Combined final report
- risk_warnings: List of risk alerts (NEW!)
- is_overbought: RSI > 70 flag (NEW!)
- has_negative_news: Negative news flag (NEW!)
- is_speculative: High volatility flag (NEW!)

📌 RISK SENTINEL FEATURE (NODE 6):
----------------------------------
This node provides STRICT RULE-BASED warnings:
- RSI > 70 → ⚠️ "OVERBOUGHT - Wait for correction"
- RSI < 30 → 🟢 "OVERSOLD - Potential opportunity"
- Negative news → 🚨 "AVOID NOW - Do not invest!"
- High volatility → ⚡ "SPECULATIVE ZONE - Only for aggressive"

KEY PATTERNS (From Your Notes):
-------------------------------
1. StateGraph(State) - Create graph with typed state
2. add_node(name, func) - Register nodes
3. add_edge(from, to) - Define flow
4. compile() - Finalize graph
5. invoke(state) - Run the graph

FOR YOUR INTERVIEW:
-------------------
"I implemented a SMART ROUTING system for stock research using LangGraph.

The system first DETECTS if the query is about:
- A specific COMPANY (e.g., 'Tata Motors stock') → Uses 7-node workflow
- A SECTOR (e.g., 'Should I buy defence shares?') → Uses 4-node workflow

COMPANY ANALYSIS (7 Nodes):
1. Company Introduction - What the company does
2. Sector Analysis - Uses intro for accurate sector identification
3. Company Research - Gets financials from MoneyControl, Screener.in
4. Policy Watchdog - Government policy impacts
5. Investor Sentiment - FII/DII holdings and analyst ratings
6. Technical Analysis - RSI, moving averages, RISK WARNINGS (overbought, negative news)
7. Investment Suggestion - RISK-AWARE buy/sell/hold recommendation

SECTOR ANALYSIS (4 Nodes - for queries like 'defence shares'):
1. General Overview - Current news and sector state
2. Investor Sentiment - Market sentiment for the sector
3. Technical Analysis - Sector valuation and risks
4. Investment Suggestion - Recommendation + top companies to consider

This smart routing ensures users get relevant analysis whether they're asking
about a specific company or an entire sector."

===================================================================================
"""

