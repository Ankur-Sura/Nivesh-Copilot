/**
 * ===================================================================================
 *                     AI COPILOT COMPONENT - THE BRAIN OF FRONTEND 🧠
 * ===================================================================================
 * 
 * 📚 WHAT IS THIS FILE?
 * ---------------------
 * This is the main AI chat interface for Nivesh Copilot. It handles:
 * 1. Text-based chat with AI
 * 2. Voice commands (Speech-to-Text using OpenAI Whisper)
 * 3. Stock research queries (7-node LangGraph workflow)
 * 4. Human-in-the-Loop order confirmation
 * 
 * 🔗 HOW IT CONNECTS TO OTHER COMPONENTS:
 * ---------------------------------------
 * 
 *     AICopilot.js (This file - Frontend)
 *            ↓ axios.post()
 *     Backend (Node.js - port 3002) - backend/index.js
 *            ↓ axios.post()
 *     AI Service (FastAPI - port 8000) - AI/agent_service.py
 *            ↓
 *     LangGraph Workflow - AI/stock_graph.py
 * 
 * 📌 INTERVIEW KEY POINTS:
 * -----------------------
 * 1. "How does voice input work?"
 *    → MediaRecorder API captures audio → sends to /ai/transcribe → OpenAI Whisper
 * 
 * 2. "How is Human-in-the-Loop implemented?"
 *    → Order commands detected → Dialog shown for confirmation → Only on confirm, order is placed
 * 
 * 3. "How do you detect if user wants to place an order?"
 *    → /ai/detect-order endpoint uses GPT to parse natural language
 * 
 * ===================================================================================
 */

// =============================================================================
//                           IMPORTS SECTION
// =============================================================================

import React, { useState, useRef, useEffect } from "react";
/**
 * 📖 React Hooks:
 * - useState: Manage component state (messages, loading, input, etc.)
 * - useRef: Keep references that persist across renders (mediaRecorder, audio chunks)
 * - useEffect: Run side effects (scroll to bottom when messages change)
 */

import axios from "axios";
/**
 * 📖 Axios - HTTP client for making API calls
 * Why Axios over fetch?
 * - Automatic JSON parsing
 * - Better error handling
 * - Request/response interceptors
 * - Easier file upload (FormData)
 * 
 * 🔗 Used for:
 * - POST /ai/chat → General AI chat
 * - POST /ai/stock-research → 7-node stock analysis
 * - POST /ai/transcribe → Voice to text (Whisper)
 * - POST /ai/detect-order → Check if query is a buy/sell order
 * - GET /api/stock-price/:symbol → Get current stock price
 */

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
/**
 * 📖 ReactMarkdown + remark-gfm
 * Why? AI responses contain markdown (tables, bold, headers)
 * - ReactMarkdown: Renders markdown as React components
 * - remark-gfm: GitHub Flavored Markdown plugin (tables, strikethrough)
 * 
 * 🔗 This is how we display formatted AI responses with tables!
 */

import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
/**
 * 📖 Material-UI Components
 * Pre-built React components following Google's Material Design
 * 
 * Key components used:
 * - Dialog: For Human-in-the-Loop order confirmation popup
 * - Paper: Card-like container with shadow
 * - TextField: Input for chat messages
 * - CircularProgress: Loading spinner
 * - Alert: Error/warning messages
 */

import {
  Send,
  Mic,
  MicOff,
  SmartToy,
  TrendingUp,
  ShoppingCart,
  Refresh,
} from "@mui/icons-material";
/**
 * 📖 Material-UI Icons
 * - Mic/MicOff: Voice recording toggle
 * - Send: Send message button
 * - SmartToy: AI assistant icon
 * - TrendingUp: Stock analysis mode
 * - ShoppingCart: Order placement
 */

import "./AICopilot.css";

// =============================================================================
//                     MAIN COMPONENT: AICopilot
// =============================================================================

const AICopilot = () => {
  // ===========================================================================
  //                     STATE MANAGEMENT
  // ===========================================================================
  
  /**
   * 📖 useState Hook - Managing Component State
   * 
   * In React, state is data that can change over time.
   * When state changes, React re-renders the component.
   * 
   * Syntax: const [value, setValue] = useState(initialValue);
   */

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Hi! I'm your AI Trading Copilot. I can help you with:\n\n📊 **Stock Analysis** - 7-step comprehensive research\n💬 **General Questions** - Market insights, news, policies\n🎤 **Voice Input** - Just speak your query!\n🛒 **Place Orders** - Say 'Buy 10 shares of TCS'\n\n💡 **Try asking:**\n• 'Tell me about Tata Motors stock'\n• 'Buy 5 shares of Reliance'\n• 'What's the latest news on HDFC?'",
    },
  ]);
  /**
   * 📖 messages: Array of chat messages
   * 
   * Structure:
   * { 
   *   role: "user" | "assistant",
   *   content: "message text",
   *   data: {} // optional - for stock analysis data
   * }
   * 
   * 🔗 Maps to: How chatbots store conversation history
   * Similar to OpenAI's message format!
   */

  const [input, setInput] = useState("");
  // User's current input text

  const [loading, setLoading] = useState(false);
  // Show loading spinner while waiting for AI response

  const [isRecording, setIsRecording] = useState(false);
  // Is microphone currently recording?

  const [error, setError] = useState(null);
  // Error message to display

  const [mode, setMode] = useState("chat");
  // Current mode: "chat" or "stock-research"

  // ===========================================================================
  //                     🆕 HUMAN-IN-THE-LOOP: ORDER DIALOG STATE
  // ===========================================================================
  
  /**
   * 📖 Human-in-the-Loop Pattern
   * 
   * WHAT: User must confirm before AI executes important actions
   * WHY: Prevents accidental orders, gives user control
   * 
   * FLOW:
   * 1. User says "Buy 10 TCS shares"
   * 2. AI detects this is an order command
   * 3. Instead of executing, show confirmation dialog
   * 4. User reviews: stock name, quantity, price
   * 5. User clicks "Confirm" → Order placed
   * 6. User clicks "Cancel" → Order cancelled
   * 
   * 🔗 This is similar to solo_trip's "intervention points"!
   */
  const [orderDialog, setOrderDialog] = useState({ 
    open: false,           // Is dialog visible?
    details: null,         // Order details from AI detection
    query: "",             // Original user query
    currentPrice: null,    // Fetched from Yahoo Finance
    priceLoading: false,   // Loading price?
    editedQuantity: 1,     // User can modify quantity
    editedPrice: 0,        // User can set limit price
    priceType: "MARKET",   // "MARKET" or "LIMIT"
    orderAction: "BUY",    // "BUY" or "SELL"
    isFromVoice: false     // Track if order came from voice command
  });
  
  // ===========================================================================
  //                     REFS - Persist Values Without Re-render
  // ===========================================================================
  
  /**
   * 📖 useRef Hook
   * 
   * Unlike useState, useRef doesn't trigger re-render when value changes.
   * Used for:
   * - Storing mutable values that don't need UI update
   * - Accessing DOM elements directly
   * 
   * Here we use it for:
   * - messagesEndRef: Scroll to bottom of chat
   * - mediaRecorderRef: Store MediaRecorder instance
   * - audioChunksRef: Store audio data during recording
   */
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ===========================================================================
  //                     EFFECT: AUTO-SCROLL TO BOTTOM
  // ===========================================================================
  
  /**
   * 📖 useEffect Hook
   * 
   * Runs side effects after render.
   * Here: Scrolls to bottom when new messages arrive.
   * 
   * Syntax: useEffect(callback, [dependencies])
   * - callback runs when any dependency changes
   * - [messages] = run when messages array changes
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ===========================================================================
  //                     🎤 VOICE RECORDING FUNCTIONS
  // ===========================================================================
  
  /**
   * 📖 Voice Input Implementation
   * 
   * FLOW:
   * 1. User clicks Mic button → startRecording()
   * 2. Browser asks for microphone permission
   * 3. MediaRecorder captures audio chunks
   * 4. User clicks Mic again → stopRecording()
   * 5. Audio chunks combined into Blob
   * 6. Blob sent to /ai/transcribe (OpenAI Whisper)
   * 7. Transcribed text put in input field
   * 8. Auto-send the message
   * 
   * 🔗 CONNECTS TO:
   * - Backend: POST /ai/transcribe (proxy)
   * - AI Service: POST /stt/transcribe (OpenAI Whisper)
   * 
   * 📌 INTERVIEW: "How does voice input work?"
   * "I use the Web MediaRecorder API to capture audio from the user's microphone.
   * The audio is sent as a Blob to our backend, which forwards it to OpenAI's
   * Whisper API for transcription. The transcribed text then triggers the same
   * flow as text input."
   */
  
  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      /**
       * 📖 getUserMedia - Browser API for accessing camera/microphone
       * Returns a MediaStream that we can record from
       * 
       * ⚠️ This prompts user for permission!
       */
      
      const mediaRecorder = new MediaRecorder(stream);
      /**
       * 📖 MediaRecorder - Browser API for recording media
       * Takes a stream and records it into chunks
       */
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // When audio data is available, store it
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // When recording stops, process the audio
      mediaRecorder.onstop = async () => {
        // Combine chunks into a single Blob
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        /**
         * 📖 Blob - Binary Large Object
         * Represents raw binary data (like a file)
         * We specify type: "audio/webm" for the audio format
         */
        
        // Send to AI for transcription
        await sendAudioToTranscribe(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Microphone access denied. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  /**
   * 📖 Send Audio to Backend for Transcription
   * 
   * 🔗 API FLOW:
   * Frontend → POST /ai/transcribe (Backend) → POST /stt/transcribe (AI Service)
   * 
   * Backend (index.js):
   *   app.post("/ai/transcribe", upload.single("audio"), async (req, res) => {
   *     // Forward to AI service
   *     await axios.post(`${AI_SERVICE_URL}/stt/transcribe`, formData);
   *   });
   * 
   * AI Service (tools_service.py):
   *   @tools_router.post("/stt/transcribe")
   *   async def transcribe_audio(file: UploadFile):
   *     # Use OpenAI Whisper
   *     response = client.audio.transcriptions.create(
   *       model="whisper-1",
   *       file=audio_file
   *     )
   *     return {"text": response.text}
   */
  const sendAudioToTranscribe = async (audioBlob) => {
    try {
      setLoading(true);
      
      // Create FormData to send file
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      /**
       * 📖 FormData - API for sending form data with files
       * .append(name, value, filename)
       * Required for multipart/form-data requests
       */

      const response = await axios.post(
        "http://localhost:3002/ai/transcribe",  // Backend proxy endpoint
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const transcribedText = response.data.text;
      setInput(transcribedText);
      
      // Auto-send the transcribed text
      // Mark as voice input (true) for order tracking
      if (transcribedText.trim()) {
        await sendMessage(transcribedText, true);  // true = from voice
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setError("Failed to transcribe audio. Please try typing instead.");
    } finally {
      setLoading(false);
    }
  };

  // ===========================================================================
  //                     🔍 QUERY DETECTION FUNCTIONS
  // ===========================================================================

  /**
   * 📖 Detect if Query is Stock-Related
   * 
   * Simple keyword matching to route query to correct endpoint:
   * - Stock query → /ai/stock-research (7-node LangGraph workflow)
   * - General query → /ai/chat (simple chat with tools)
   * 
   * 🔗 This is "Smart Routing" mentioned in agent_service.py!
   */
  const detectStockQuery = (query) => {
    const stockKeywords = [
      "stock", "share", "company", "tata", "reliance", "hdfc", "infosys",
      "tcs", "icici", "sbi", "buy", "sell", "invest", "analysis", "sector",
      "defence", "banking", "pharma", "auto", "fmcg"
    ];
    return stockKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  };

  // ===========================================================================
  //                     💰 STOCK PRICE FETCHING
  // ===========================================================================

  /**
   * 📖 Fetch Current Stock Price
   * 
   * 🔗 API FLOW:
   * Frontend → GET /api/stock-price/:symbol (Backend) → GET /tools/stock-price/:symbol (AI Service)
   * 
   * AI Service uses Yahoo Finance (yfinance library):
   *   stock = yf.Ticker(f"{symbol}.NS")  # .NS = NSE India
   *   return stock.info['currentPrice']
   * 
   * 📌 Why fetch price?
   * For Human-in-the-Loop: Show user current price before order confirmation
   */
  const fetchStockPrice = async (symbol) => {
    try {
      const encodedSymbol = encodeURIComponent(symbol);
      /**
       * 📖 encodeURIComponent
       * Encodes special characters in URL
       * "Tata Motors" → "Tata%20Motors"
       * Required for stock names with spaces!
       */
      console.log("Fetching price for:", symbol, "encoded:", encodedSymbol);
      const response = await axios.get(`http://localhost:3002/api/stock-price/${encodedSymbol}`);
      console.log("Price response:", response.data);
      return response.data;
    } catch (err) {
      console.error("Stock price fetch error:", err);
      return null;
    }
  };

  // ===========================================================================
  //                     🛒 ORDER DETECTION (HUMAN-IN-THE-LOOP)
  // ===========================================================================

  /**
   * 📖 Detect if Query is an Order Command
   * 
   * Uses AI (GPT) to parse natural language order commands:
   * - "Buy 10 shares of Reliance" → { action: "BUY", quantity: 10, stock_name: "Reliance" }
   * - "Sell 5 TCS" → { action: "SELL", quantity: 5, stock_name: "TCS" }
   * 
   * 🔗 API FLOW:
   * Frontend → POST /ai/detect-order (Backend) → POST /agent/detect-order (AI Service)
   * 
   * AI Service (agent_service.py):
   *   @agent_router.post("/agent/detect-order")
   *   async def detect_order(payload: Dict):
   *     # Uses GPT to analyze if query is a trading order
   *     prompt = "Analyze if this is a stock trading order..."
   *     response = client.chat.completions.create(...)
   *     return {"is_order": True, "action": "BUY", ...}
   * 
   * 📌 INTERVIEW: "How do you detect order commands?"
   * "I use GPT to parse natural language queries. The AI extracts:
   * - Action (BUY/SELL)
   * - Stock name
   * - Quantity
   * - Price (if specified)
   * This enables users to place orders using voice or text naturally."
   */
  const detectOrderCommand = async (query) => {
    try {
      const response = await axios.post("http://localhost:3002/ai/detect-order", {
        query
      });
      
      console.log("Order detection response:", response.data);
      
      if (response.data.is_order || response.data.order_details?.is_order) {
        // Flatten the response structure
        const result = {
          is_order: true,
          stock_name: response.data.stock_name || response.data.order_details?.stock_name,
          quantity: response.data.quantity || response.data.order_details?.quantity,
          action: response.data.action || response.data.order_details?.action,
          price: response.data.price || response.data.order_details?.price,
          confidence: response.data.confidence || response.data.order_details?.confidence
        };
        console.log("Flattened order result:", result);
        return result;
      }
      return null;
    } catch (err) {
      console.error("Order detection error:", err);
      return null;
    }
  };

  // ===========================================================================
  //                     🎯 OPEN ORDER DIALOG (HUMAN-IN-THE-LOOP)
  // ===========================================================================

  /**
   * 📖 Open Order Confirmation Dialog
   * 
   * This is the "Human-in-the-Loop" intervention point.
   * Instead of executing order immediately:
   * 1. Show dialog with order details
   * 2. Fetch current stock price (for user reference)
   * 3. Allow user to modify quantity, price type
   * 4. User confirms OR cancels
   * 
   * 📌 Why Human-in-the-Loop?
   * - Prevents accidental orders (especially with voice)
   * - Gives user control and transparency
   * - Matches regulatory requirements for trading apps
   */
  const openOrderDialog = async (orderDetails, query, isFromVoice = false) => {
    console.log("Opening order dialog with details:", orderDetails, "Voice:", isFromVoice);
    
    // Extract values from potentially nested response
    const stockName = orderDetails.stock_name || orderDetails.order_details?.stock_name || "Unknown";
    const quantity = orderDetails.quantity || orderDetails.order_details?.quantity || 1;
    const action = orderDetails.action || orderDetails.order_details?.action || "BUY";
    const price = orderDetails.price || orderDetails.order_details?.price || "MARKET";
    
    console.log("Extracted - Stock:", stockName, "Qty:", quantity, "Action:", action);
    
    // Set initial dialog state
    setOrderDialog(prev => ({
      ...prev,
      open: true,
      details: { ...orderDetails, stock_name: stockName },
      query: query,
      priceLoading: true,
      editedQuantity: quantity,
      editedPrice: price === "MARKET" ? 0 : (price || 0),
      priceType: price === "MARKET" ? "MARKET" : "LIMIT",
      orderAction: action,
      isFromVoice: isFromVoice  // Track source for order logging
    }));

    // Fetch current price from Yahoo Finance
    if (stockName && stockName !== "Unknown") {
      const priceData = await fetchStockPrice(stockName);
      console.log("Fetched price data:", priceData);
      setOrderDialog(prev => ({
        ...prev,
        currentPrice: priceData?.price || null,
        priceLoading: false,
        editedPrice: prev.priceType === "MARKET" ? (priceData?.price || 0) : prev.editedPrice
      }));
    } else {
      setOrderDialog(prev => ({
        ...prev,
        currentPrice: null,
        priceLoading: false
      }));
    }
  };

  // ===========================================================================
  //                     📤 PLACE SIMULATED ORDER
  // ===========================================================================

  /**
   * 📖 Place Simulated Order
   * 
   * Called when user confirms the order in dialog.
   * Sends order to backend which saves to MongoDB.
   * 
   * 🔗 API FLOW:
   * Frontend → POST /newOrder (Backend) → MongoDB (orders collection)
   * 
   * Backend (index.js):
   *   app.post("/newOrder", async (req, res) => {
   *     const { name, qty, price, mode, is_voice_order, is_simulated } = req.body;
   *     const newOrder = new OrdersModel({...});
   *     await newOrder.save();
   *     // Also updates holdings if order is confirmed
   *   });
   * 
   * 📌 Why "simulated"?
   * This is a demo app - no real money involved!
   * But the flow is same as real trading apps.
   */
  const placeSimulatedOrder = async () => {
    const { details, editedQuantity, editedPrice, priceType, orderAction, currentPrice, isFromVoice } = orderDialog;
    const finalPrice = priceType === "MARKET" ? currentPrice : editedPrice;
    
    try {
      const response = await axios.post("http://localhost:3002/newOrder", {
        name: details.stock_name,
        qty: editedQuantity,
        price: finalPrice || 0,
        mode: orderAction.toLowerCase(),
        is_voice_order: isFromVoice,  // True only if from voice command
        is_simulated: true            // Mark as simulated order
      });
      
      return { success: true, message: response.data, finalPrice, quantity: editedQuantity, isFromVoice };
    } catch (err) {
      console.error("Order placement error:", err);
      return { success: false, message: err.message };
    }
  };

  // ===========================================================================
  //                     📨 SEND MESSAGE - MAIN FLOW
  // ===========================================================================

  /**
   * 📖 Main Message Sending Function
   * 
   * This is the CORE LOGIC of the AI Copilot. It handles:
   * 1. Order detection (Human-in-the-Loop)
   * 2. Stock research queries (7-node workflow)
   * 3. General chat queries
   * 
   * FLOW:
   * ┌─────────────────────────────────────────────────────────────┐
   * │                    User sends message                       │
   * └─────────────────────────────────────────────────────────────┘
   *                              ↓
   * ┌─────────────────────────────────────────────────────────────┐
   * │  Check: Does it contain order keywords (buy/sell)?         │
   * └─────────────────────────────────────────────────────────────┘
   *              ↓ YES                              ↓ NO
   * ┌────────────────────────┐          ┌────────────────────────┐
   * │ Call /ai/detect-order  │          │ Check: Is it stock-    │
   * │ to verify with GPT     │          │ related?               │
   * └────────────────────────┘          └────────────────────────┘
   *              ↓                                  ↓
   * ┌────────────────────────┐    YES ┌────────────────────────┐
   * │ Is it really an order? │ ←───── │ /ai/stock-research     │
   * └────────────────────────┘        │ (7-node LangGraph)     │
   *      ↓ YES        ↓ NO           └────────────────────────┘
   * ┌──────────┐  ┌──────────┐               NO ↓
   * │ Show     │  │ Regular  │        ┌────────────────────────┐
   * │ Dialog   │  │ Chat     │        │ /ai/chat               │
   * │(Human-   │  │          │        │ (General chat)         │
   * │in-Loop)  │  │          │        └────────────────────────┘
   * └──────────┘  └──────────┘
   * 
   * @param {string} text - Message text (optional, uses input state if not provided)
   * @param {boolean} isFromVoice - Whether message came from voice input
   */
  const sendMessage = async (text = null, isFromVoice = false) => {
    const query = text || input.trim();
    if (!query) return;

    // Quick check for order keywords before API call
    const orderKeywords = ["buy", "sell", "purchase", "order"];
    const mightBeOrder = orderKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );

    // STEP 1: Check if this is an order command
    if (mightBeOrder) {
      try {
        const orderResult = await detectOrderCommand(query);
        
        if (orderResult && orderResult.is_order) {
          // Clear input immediately
          setInput("");
          // Show Human-in-the-Loop dialog
          await openOrderDialog(orderResult, query, isFromVoice);
          return;  // Don't proceed to regular chat
        }
      } catch (err) {
        console.error("Order detection failed, proceeding with chat:", err);
        // Fall through to regular chat
      }
    }

    // STEP 2: Regular message flow
    // Add user message to chat
    const userMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      // STEP 3: Detect if stock query and route accordingly
      const isStockQuery = detectStockQuery(query);
      const endpoint = isStockQuery ? "/ai/stock-research" : "/ai/chat";
      /**
       * 🔗 ENDPOINT ROUTING:
       * 
       * /ai/stock-research → Backend → AI Service /agent/stock-research
       *   → Runs 7-node LangGraph workflow (stock_graph.py)
       *   → Returns: company_intro, sector_analysis, company_research,
       *              policy_analysis, investor_sentiment, technical_analysis,
       *              investment_suggestion, final_recommendation
       * 
       * /ai/chat → Backend → AI Service /agent/smart-chat
       *   → Simple agent with tools (web search, etc.)
       *   → Returns: answer/message
       */
      
      setMode(isStockQuery ? "stock-research" : "chat");

      // STEP 4: Make API call
      const response = await axios.post(
        `http://localhost:3002${endpoint}`,
        {
          query,
          thread_id: "dashboard-session",  // For conversation memory
          user_id: "user-1",
        }
      );

      // STEP 5: Handle response based on endpoint
      let assistantMessage;
      if (isStockQuery) {
        // Stock research returns structured data
        const data = response.data;
        /**
         * 📖 Stock Research Response Structure:
         * {
         *   success: true,
         *   company_name: "Reliance Industries",
         *   company_intro: "...",
         *   sector_analysis: "...",
         *   company_research: "...",
         *   policy_analysis: "...",
         *   investor_sentiment: "...",
         *   technical_analysis: "...",
         *   investment_suggestion: "...",
         *   final_recommendation: "# Complete Analysis...",  // Markdown formatted
         *   risk_warnings: ["Overbought condition", ...]
         * }
         */
        
        let content = data.final_recommendation;
        if (!content && data.investment_suggestion) {
          content = `# 📊 Stock Analysis: ${data.company_name || 'Stock'}\n\n${data.investment_suggestion}`;
        }
        if (!content) {
          content = "Analysis complete! Check the detailed data below.";
        }
        
        assistantMessage = {
          role: "assistant",
          content: content,
          data: data,  // Store full data for risk warnings display
        };
      } else {
        // Chat returns simple message
        assistantMessage = {
          role: "assistant",
          content: response.data.answer || response.data.message || response.data.content || "I'm here to help!",
        };
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Error sending message:", err);
      setError(
        err.response?.data?.message || 
        "Failed to get response. Please check if AI service is running."
      );
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Sorry, I encountered an error. Please try again or check if the AI service is running on port 8000.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================================================
  //                     ⌨️ KEYBOARD EVENT HANDLER
  // ===========================================================================

  /**
   * 📖 Handle Enter Key Press
   * 
   * When user presses Enter (without Shift), send the message.
   * Shift+Enter = New line (for multi-line messages)
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();  // Prevent default newline
      sendMessage();
    }
  };

  // ===========================================================================
  //                     🎨 RENDER - JSX
  // ===========================================================================

  /**
   * 📖 JSX - JavaScript XML
   * 
   * React's syntax for writing UI components.
   * Looks like HTML but it's JavaScript!
   * 
   * Key concepts:
   * - {} = JavaScript expression inside JSX
   * - className = HTML class attribute
   * - onClick = Event handler
   * - map() = Render list of items
   * - Conditional rendering: {condition && <Component />}
   */

  return (
    <Box className="ai-copilot-container">
      <Paper className="ai-copilot-paper" elevation={3}>
        {/* ===== HEADER ===== */}
        <Box className="ai-copilot-header">
          <Box display="flex" alignItems="center" gap={1}>
            <SmartToy color="primary" />
            <Typography variant="h6" fontWeight="bold">
              AI Trading Copilot
            </Typography>
          </Box>
          {/* Mode indicator chip - shows if in stock research or chat mode */}
          <Chip
            icon={mode === "stock-research" ? <TrendingUp /> : <SmartToy />}
            label={mode === "stock-research" ? "Stock Analysis" : "Chat Mode"}
            color={mode === "stock-research" ? "primary" : "default"}
            size="small"
          />
        </Box>

        {/* ===== ERROR ALERT ===== */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1 }}>
            {error}
          </Alert>
        )}

        {/* ===== MESSAGES LIST ===== */}
        <Box className="ai-copilot-messages">
          {messages.map((msg, idx) => (
            <Box
              key={idx}
              className={`message ${msg.role === "user" ? "user-message" : "assistant-message"}`}
            >
              {msg.role === "user" ? (
                // User messages - plain text
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {msg.content}
                </Typography>
              ) : (
                // Assistant messages - render as Markdown
                /**
                 * 📖 ReactMarkdown
                 * 
                 * Converts markdown text to React components.
                 * remarkGfm adds GitHub Flavored Markdown support:
                 * - Tables (| Col1 | Col2 |)
                 * - Strikethrough (~~text~~)
                 * - Task lists (- [ ] task)
                 * 
                 * This is how AI's formatted responses with tables are displayed!
                 */
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
              {/* Risk warnings from stock analysis */}
              {msg.data && msg.data.risk_warnings && msg.data.risk_warnings.length > 0 && (
                <Box mt={1}>
                  {msg.data.risk_warnings.map((warning, i) => (
                    <Alert key={i} severity="warning" sx={{ mt: 0.5 }}>
                      {warning}
                    </Alert>
                  ))}
                </Box>
              )}
            </Box>
          ))}
          {/* Loading indicator */}
          {loading && (
            <Box className="message assistant-message" sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={20} />
              <Typography variant="body2" sx={{ ml: 1 }}>
                Analyzing...
              </Typography>
            </Box>
          )}
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </Box>

        {/* ===== INPUT AREA ===== */}
        <Box className="ai-copilot-input">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={
              isRecording
                ? "🎤 Recording... Click mic again to stop"
                : "Ask about stocks, market news, or use voice input... (Press Enter to send)"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || isRecording}
            variant="outlined"
            size="small"
          />
          <Box display="flex" gap={1} mt={1}>
            {/* Voice input button */}
            <IconButton
              color={isRecording ? "error" : "primary"}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading}
              title={isRecording ? "Stop Recording" : "Start Voice Input"}
            >
              {isRecording ? <MicOff /> : <Mic />}
            </IconButton>
            {/* Send button */}
            <IconButton
              color="primary"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim() || isRecording}
              title="Send Message"
            >
              <Send />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* ===========================================================================
                          🛒 HUMAN-IN-THE-LOOP: ORDER CONFIRMATION DIALOG
         ===========================================================================
         
         📖 This Dialog is the Human-in-the-Loop intervention point.
         
         When user says "Buy 10 TCS shares" (via text or voice):
         1. AI detects this is an order command
         2. Instead of executing immediately, this dialog opens
         3. User sees: Stock name, current price, can modify quantity
         4. User MUST click "Place Order" to execute
         5. If user clicks "Cancel", order is NOT placed
         
         This pattern:
         - Prevents accidental orders
         - Gives user final control
         - Required for financial applications
         - Similar to what you did in solo_trip "intervention points"
         
         🔗 Dialog is from Material-UI
         Opens when: orderDialog.open === true
         Closes when: User clicks Cancel or Confirm
      */}
      <Dialog
        open={orderDialog.open}
        onClose={() => setOrderDialog(prev => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        {/* Header - Green for BUY, Red for SELL */}
        <DialogTitle sx={{ 
          background: orderDialog.orderAction === "BUY" 
            ? 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)' 
            : 'linear-gradient(135deg, #f44336 0%, #c62828 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <ShoppingCart />
          Place {orderDialog.orderAction} Order
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {/* Stock Name & Current Price */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {orderDialog.details?.stock_name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Current Price:
              </Typography>
              {orderDialog.priceLoading ? (
                <CircularProgress size={16} />
              ) : (
                <Typography variant="h6" fontWeight="bold" color={orderDialog.currentPrice ? 'success.main' : 'error.main'}>
                  {orderDialog.currentPrice ? `₹${orderDialog.currentPrice.toLocaleString('en-IN')}` : 'N/A'}
                </Typography>
              )}
              {/* Refresh price button */}
              <IconButton 
                size="small" 
                onClick={async () => {
                  setOrderDialog(prev => ({ ...prev, priceLoading: true }));
                  const priceData = await fetchStockPrice(orderDialog.details?.stock_name);
                  setOrderDialog(prev => ({ 
                    ...prev, 
                    currentPrice: priceData?.price || null, 
                    priceLoading: false 
                  }));
                }}
              >
                <Refresh fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Order Type (Buy/Sell) */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Order Type</Typography>
            <RadioGroup
              row
              value={orderDialog.orderAction}
              onChange={(e) => setOrderDialog(prev => ({ ...prev, orderAction: e.target.value }))}
            >
              <FormControlLabel 
                value="BUY" 
                control={<Radio color="success" />} 
                label={<Typography color="success.main" fontWeight="bold">BUY</Typography>}
              />
              <FormControlLabel 
                value="SELL" 
                control={<Radio color="error" />} 
                label={<Typography color="error.main" fontWeight="bold">SELL</Typography>}
              />
            </RadioGroup>
          </FormControl>

          {/* Quantity Input */}
          <TextField
            fullWidth
            label="Quantity (Shares)"
            type="number"
            value={orderDialog.editedQuantity}
            onChange={(e) => setOrderDialog(prev => ({ 
              ...prev, 
              editedQuantity: Math.max(1, parseInt(e.target.value) || 1) 
            }))}
            InputProps={{
              inputProps: { min: 1 }
            }}
            sx={{ mb: 2 }}
          />

          {/* Price Type (Market/Limit) */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Price Type</Typography>
            <RadioGroup
              row
              value={orderDialog.priceType}
              onChange={(e) => setOrderDialog(prev => ({ 
                ...prev, 
                priceType: e.target.value,
                editedPrice: e.target.value === "MARKET" ? prev.currentPrice : prev.editedPrice
              }))}
            >
              <FormControlLabel value="MARKET" control={<Radio />} label="Market Price" />
              <FormControlLabel value="LIMIT" control={<Radio />} label="Limit Price" />
            </RadioGroup>
          </FormControl>

          {/* Limit Price Input (only if LIMIT selected) */}
          {orderDialog.priceType === "LIMIT" && (
            <TextField
              fullWidth
              label="Limit Price (₹)"
              type="number"
              value={orderDialog.editedPrice}
              onChange={(e) => setOrderDialog(prev => ({ 
                ...prev, 
                editedPrice: parseFloat(e.target.value) || 0 
              }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                inputProps: { min: 0, step: 0.05 }
              }}
              sx={{ mb: 2 }}
            />
          )}

          <Divider sx={{ my: 2 }} />

          {/* Order Summary */}
          <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Order Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Quantity:</Typography>
              <Typography fontWeight="bold">{orderDialog.editedQuantity} shares</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Price:</Typography>
              <Typography fontWeight="bold">
                {orderDialog.priceType === "MARKET" 
                  ? `₹${(orderDialog.currentPrice || 0).toLocaleString('en-IN')} (Market)`
                  : `₹${orderDialog.editedPrice.toLocaleString('en-IN')} (Limit)`
                }
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Total Value:</Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                ₹{((orderDialog.priceType === "MARKET" ? orderDialog.currentPrice : orderDialog.editedPrice) * orderDialog.editedQuantity || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Box>

          {/* Warning about simulated order */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>⚠️ SIMULATED ORDER</strong> - This is for demo purposes only. No real trade will be executed.
          </Alert>
        </DialogContent>
        
        {/* Dialog Actions - Cancel and Confirm buttons */}
        <DialogActions sx={{ p: 2 }}>
          {/* Cancel Button */}
          <Button 
            onClick={() => {
              const { query } = orderDialog;
              setOrderDialog(prev => ({ ...prev, open: false }));
              setMessages((prev) => [
                ...prev,
                { role: "user", content: query },
                { role: "assistant", content: "❌ Order cancelled. No order was placed." }
              ]);
            }}
            color="inherit"
            variant="outlined"
          >
            Cancel
          </Button>
          
          {/* Confirm Button - Places the order */}
          <Button
            onClick={async () => {
              const { details, query, editedQuantity, priceType, currentPrice, editedPrice, orderAction } = orderDialog;
              setOrderDialog(prev => ({ ...prev, open: false }));
              setLoading(true);
              
              // Call placeSimulatedOrder to save to database
              const result = await placeSimulatedOrder();
              setLoading(false);
              
              const finalPrice = priceType === "MARKET" ? currentPrice : editedPrice;
              const totalValue = (finalPrice * editedQuantity).toLocaleString('en-IN', { maximumFractionDigits: 2 });
              
              if (result.success) {
                // Show success message with order details
                setMessages((prev) => [
                  ...prev,
                  { role: "user", content: query },
                  {
                    role: "assistant",
                    content: `✅ **Simulated ${orderAction} Order Placed Successfully!**\n\n` +
                      `| Detail | Value |\n|--------|-------|\n` +
                      `| **Stock** | ${details.stock_name} |\n` +
                      `| **Action** | ${orderAction} |\n` +
                      `| **Quantity** | ${editedQuantity} shares |\n` +
                      `| **Price** | ₹${finalPrice?.toLocaleString('en-IN') || 'N/A'} |\n` +
                      `| **Total Value** | ₹${totalValue} |\n\n` +
                      `⚠️ This is a **simulated order**. No real trade was executed.\n\n` +
                      `📋 View your order in the **Orders** tab.`
                  }
                ]);
              } else {
                setError("Failed to place order. Please try again.");
              }
            }}
            color={orderDialog.orderAction === "BUY" ? "success" : "error"}
            variant="contained"
            disabled={orderDialog.priceLoading || (!orderDialog.currentPrice && orderDialog.priceType === "MARKET")}
            size="large"
          >
            {orderDialog.orderAction === "BUY" ? "🛒 Place Buy Order" : "💰 Place Sell Order"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AICopilot;

/**
 * ===================================================================================
 *                     SUMMARY: HOW EVERYTHING CONNECTS
 * ===================================================================================
 * 
 * 🔗 COMPLETE FLOW DIAGRAM:
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────────┐
 * │                              USER INTERACTION                                   │
 * │                                                                                 │
 * │  Type message ─────────────────────────┐                                       │
 * │                                         ↓                                       │
 * │  Voice command → MediaRecorder → /ai/transcribe → OpenAI Whisper → Text       │
 * └─────────────────────────────────────────────────────────────────────────────────┘
 *                                           ↓
 * ┌─────────────────────────────────────────────────────────────────────────────────┐
 * │                              QUERY PROCESSING                                   │
 * │                                                                                 │
 * │  Is it an order? ──YES──→ /ai/detect-order → Human-in-Loop Dialog             │
 * │       ↓ NO                                           ↓                         │
 * │  Is it stock query? ──YES──→ /ai/stock-research     ↓                         │
 * │       ↓ NO                        ↓                  ↓                         │
 * │  /ai/chat ────────────────────────┼──────────────────┼                         │
 * └───────────────────────────────────┼──────────────────┼─────────────────────────┘
 *                                     ↓                  ↓
 * ┌─────────────────────────────────────────────────────────────────────────────────┐
 * │                              BACKEND (Node.js)                                  │
 * │                                                                                 │
 * │  /ai/stock-research → axios.post() → AI Service /agent/stock-research         │
 * │  /ai/chat → axios.post() → AI Service /agent/smart-chat                       │
 * │  /ai/detect-order → axios.post() → AI Service /agent/detect-order             │
 * │  /newOrder → MongoDB save + Holdings update                                    │
 * └─────────────────────────────────────────────────────────────────────────────────┘
 *                                     ↓
 * ┌─────────────────────────────────────────────────────────────────────────────────┐
 * │                              AI SERVICE (FastAPI)                               │
 * │                                                                                 │
 * │  /agent/stock-research → LangGraph 7-node workflow (stock_graph.py)           │
 * │       → company_intro_node                                                     │
 * │       → sector_analyst_node                                                    │
 * │       → company_researcher_node (MoneyControl, Screener, ET)                  │
 * │       → policy_watchdog_node                                                   │
 * │       → investor_sentiment_node                                                │
 * │       → technical_analysis_node (RSI, MAs, Risk Warnings)                     │
 * │       → investment_suggestion_node                                             │
 * │                                                                                 │
 * │  /agent/detect-order → GPT parses "Buy 10 TCS" → {action, qty, stock}         │
 * │  /stt/transcribe → OpenAI Whisper → text                                       │
 * │  /tools/stock-price → Yahoo Finance (yfinance)                                 │
 * └─────────────────────────────────────────────────────────────────────────────────┘
 * 
 * 📌 INTERVIEW SUMMARY:
 * 
 * Q: "How does your AI Copilot work?"
 * A: "It's a React component that connects to a Node.js backend, which proxies 
 *    requests to a FastAPI AI service. Users can interact via text or voice.
 *    Voice is transcribed using OpenAI Whisper. Stock queries trigger a 7-node
 *    LangGraph workflow for comprehensive analysis. Order commands use
 *    Human-in-the-Loop pattern - the user must confirm before execution."
 * 
 * Q: "Explain the Human-in-the-Loop pattern"
 * A: "When the AI detects an order command (using GPT), instead of executing
 *    immediately, it shows a confirmation dialog. The user can review the
 *    stock name, current price (fetched from Yahoo Finance), modify quantity,
 *    and choose market/limit price. Only on explicit confirmation is the
 *    order placed. This prevents accidental trades, especially with voice."
 * 
 * ===================================================================================
 */
