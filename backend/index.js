/**
 * ===================================================================================
 *                     BACKEND SERVER - THE BRIDGE 🌉
 * ===================================================================================
 * 
 * 📚 WHAT IS THIS FILE?
 * ---------------------
 * This is the Node.js/Express backend server that acts as a BRIDGE between:
 * - Frontend (React - port 3000)
 * - AI Service (FastAPI/Python - port 8000)
 * - Database (MongoDB)
 * 
 * 🔗 ARCHITECTURE:
 * ---------------
 *     Frontend (React)
 *           ↓
 *     Backend (This file - port 3002)
 *           ↓                ↓
 *     MongoDB          AI Service (FastAPI)
 *   (Holdings,         (Stock Research,
 *    Positions,         Voice Transcription,
 *    Orders)            Order Detection)
 * 
 * 📌 WHY A SEPARATE BACKEND?
 * --------------------------
 * 1. Security: Don't expose AI service directly to frontend
 * 2. Data Management: Handle MongoDB operations
 * 3. Proxy: Forward AI requests, handle authentication
 * 4. Business Logic: Order validation, holdings updates
 * 
 * 📌 INTERVIEW KEY POINTS:
 * -----------------------
 * "I use a Node.js backend as a proxy layer. It handles database operations
 * with MongoDB and forwards AI requests to the FastAPI service. This
 * separation allows independent scaling and better security."
 * 
 * ===================================================================================
 */

// =============================================================================
//                           IMPORTS & CONFIGURATION
// =============================================================================

require("dotenv").config();
/**
 * 📖 dotenv - Load environment variables from .env file
 * 
 * Why? Store sensitive data (API keys, DB URLs) outside code
 * The .env file should NEVER be committed to git!
 * 
 * After this, access variables using: process.env.VARIABLE_NAME
 */

const express = require("express");
/**
 * 📖 Express - Web framework for Node.js
 * 
 * Creates HTTP server with routing capabilities
 * Similar to FastAPI in Python!
 * 
 * Express vs FastAPI:
 * - Express: app.get("/route", handler)
 * - FastAPI: @app.get("/route") def handler():
 */

const mongoose = require("mongoose");
/**
 * 📖 Mongoose - MongoDB ODM (Object Document Mapper)
 * 
 * Provides:
 * - Schema definitions for MongoDB
 * - Model-based queries
 * - Validation
 * 
 * Similar to SQLAlchemy for Python!
 */

const bodyParser = require("body-parser");
/**
 * 📖 body-parser - Parse incoming request bodies
 * 
 * Converts JSON string → JavaScript object
 * So req.body has the parsed data
 */

const cors = require("cors");
/**
 * 📖 CORS - Cross-Origin Resource Sharing
 * 
 * Problem: Browser blocks requests from different origins
 * Frontend (port 3000) → Backend (port 3002) = BLOCKED by default!
 * 
 * cors() middleware allows these cross-origin requests
 */

const axios = require("axios");
/**
 * 📖 Axios - HTTP client for making API calls
 * 
 * Used to forward requests to AI Service (FastAPI)
 * Similar to requests library in Python!
 * 
 * axios.post(url, data) → Python: requests.post(url, json=data)
 */

const multer = require("multer");
/**
 * 📖 Multer - Middleware for handling file uploads
 * 
 * Handles multipart/form-data (file uploads)
 * Used for voice audio file uploads
 * 
 * multer.memoryStorage() = keep file in memory (not disk)
 * This is important for forwarding to AI service!
 */

const FormData = require("form-data");
/**
 * 📖 form-data - Create FormData for multipart requests
 * 
 * Used when forwarding file uploads to AI service
 * Required because axios needs special handling for files
 */

// =============================================================================
//                           DATABASE MODELS
// =============================================================================

const { HoldingsModel } = require("./model/HoldingsModel");
/**
 * 📖 HoldingsModel - MongoDB schema for stock holdings
 * 
 * Schema:
 * {
 *   name: String,      // Stock name (e.g., "RELIANCE")
 *   qty: Number,       // Quantity owned
 *   avg: Number,       // Average buy price
 *   price: Number,     // Current price
 *   net: String,       // Net change percentage
 *   day: String        // Day's change percentage
 * }
 * 
 * 🔗 Used by: Holdings page, Summary, BUY/SELL updates
 */

const { PositionsModel } = require("./model/PositionsModel");
/**
 * 📖 PositionsModel - MongoDB schema for open positions
 * 
 * Similar to holdings but for intraday positions
 * product: "CNC" (Cash & Carry), "MIS" (Margin Intraday Square-off)
 */

const { OrdersModel } = require("./model/OrdersModel");
/**
 * 📖 OrdersModel - MongoDB schema for orders
 * 
 * Schema:
 * {
 *   name: String,           // Stock name
 *   qty: Number,            // Quantity
 *   price: Number,          // Price
 *   mode: String,           // "buy" or "sell"
 *   is_voice_order: Boolean, // From voice command?
 *   is_simulated: Boolean,   // From AI Copilot?
 *   status: String          // "pending", "executed", "rejected"
 * }
 * 
 * 🔗 Human-in-the-Loop: AI/Voice orders are "pending" until confirmed
 */

// =============================================================================
//                           CONFIGURATION
// =============================================================================

const PORT = process.env.PORT || 3002;
/**
 * 📖 Server port configuration
 * 
 * Uses PORT from .env, defaults to 3002
 * This is where frontend sends requests to
 */

const uri = process.env.MONGO_URL;
/**
 * 📖 MongoDB connection string
 * 
 * Format: mongodb://localhost:27017/zerodha
 * OR: mongodb+srv://username:password@cluster.mongodb.net/database (Atlas)
 * 
 * ⚠️ Never commit actual credentials! Use environment variables.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
/**
 * 📖 AI Service URL
 * 
 * FastAPI server running Python AI code
 * All AI-related requests are forwarded here
 * 
 * 🔗 Endpoints:
 * - /agent/stock-research → 7-node LangGraph workflow
 * - /agent/smart-chat → General chat with tools
 * - /agent/detect-order → Parse buy/sell commands
 * - /stt/transcribe → Voice to text (Whisper)
 * - /tools/stock-price/:symbol → Yahoo Finance price
 */

// =============================================================================
//                           EXPRESS APP SETUP
// =============================================================================

const app = express();
/**
 * 📖 Create Express application instance
 * 
 * This is the main server object
 * We add routes, middleware to this
 */

app.use(cors());
/**
 * 📖 Enable CORS for all routes
 * 
 * Allows frontend (port 3000) to call backend (port 3002)
 * Without this, browser blocks the requests!
 */

app.use(bodyParser.json());
/**
 * 📖 Parse JSON request bodies
 * 
 * When frontend sends: { "query": "Tell me about TCS" }
 * This middleware parses it so req.body.query = "Tell me about TCS"
 */

app.use(bodyParser.urlencoded({ extended: true }));
/**
 * 📖 Parse URL-encoded bodies
 * 
 * For form submissions with application/x-www-form-urlencoded
 * extended: true allows nested objects
 */

// Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });
/**
 * 📖 Configure Multer for file uploads
 * 
 * memoryStorage(): Keep files in memory (Buffer)
 * This is needed because we forward files to AI service
 * 
 * Usage: app.post("/route", upload.single("fieldname"), handler)
 * Then req.file contains the uploaded file
 */

// =============================================================================
//                     💰 HOLDINGS ENDPOINTS
// =============================================================================

/**
 * 📖 GET /allHoldings
 * 
 * Returns all stock holdings from MongoDB
 * 
 * 🔗 Frontend Usage:
 * - Holdings.js: Display holdings table
 * - Summary.js: Calculate total investment, P&L
 * 
 * Response: Array of holding objects
 * [
 *   { name: "RELIANCE", qty: 2, avg: 1480, price: 1532, net: "+3.54%", day: "-0.21%" },
 *   ...
 * ]
 */
app.get("/allHoldings", async (req, res) => {
  let allHoldings = await HoldingsModel.find({});
  res.json(allHoldings);
});

/**
 * 📖 GET /allPositions
 * 
 * Returns all open positions from MongoDB
 * 
 * 🔗 Frontend Usage: Positions.js page
 */
app.get("/allPositions", async (req, res) => {
  let allPositions = await PositionsModel.find({});
  res.json(allPositions);
});

/**
 * 📖 GET /seedHoldings
 * 
 * Initialize database with sample holdings
 * 
 * ⚠️ This clears existing holdings!
 * Use only for initial setup/testing
 */
app.get("/seedHoldings", async (req, res) => {
  try {
    // Clear existing holdings and orders (for clean seed)
    await HoldingsModel.deleteMany({});
    await OrdersModel.deleteMany({});
    
    const initialHoldings = [
      { name: "INFY", qty: 5, avg: 1450.50, price: 1625.20, net: "+12.04%", day: "+1.73%" },
      { name: "TCS", qty: 3, avg: 3100.00, price: 3258.50, net: "+5.11%", day: "+0.93%" },
      { name: "RELIANCE", qty: 2, avg: 1480.00, price: 1532.40, net: "+3.54%", day: "-0.21%" },
      { name: "HDFCBANK", qty: 4, avg: 1520.00, price: 1685.30, net: "+10.87%", day: "+0.45%" },
      { name: "WIPRO", qty: 10, avg: 245.00, price: 259.40, net: "+5.88%", day: "+0.96%" },
    ];
    
    // Create both holdings AND orders to keep them in sync
    for (const holding of initialHoldings) {
      // Create holding
      const newHolding = new HoldingsModel(holding);
      await newHolding.save();
      
      // Create corresponding order (so orders and holdings stay in sync)
      const newOrder = new OrdersModel({
        name: holding.name.toUpperCase(),
        qty: holding.qty,
        price: holding.avg,
        mode: "buy",
        is_voice_order: false,
        is_simulated: false,
        status: "executed",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newOrder.save();
    }
    
    res.json({ 
      message: "Holdings and orders seeded successfully!", 
      holdings_count: initialHoldings.length,
      orders_count: initialHoldings.length
    });
  } catch (error) {
    console.error("Seed holdings error:", error);
    res.status(500).json({ error: "Failed to seed holdings" });
  }
});

// =============================================================================
//                     🛒 ORDER MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * 📖 POST /newOrder - Place a new order
 * 
 * 🔗 FLOW:
 * 1. Frontend sends order details
 * 2. Create order in MongoDB
 * 3. If manual order → execute immediately (update holdings)
 * 4. If AI/Voice order → set status "pending" (Human-in-the-Loop)
 * 
 * Request body:
 * {
 *   name: "RELIANCE",        // Stock name
 *   qty: 10,                 // Quantity
 *   price: 1532.40,          // Price per share
 *   mode: "buy" | "sell",    // Order type
 *   is_voice_order: boolean, // From voice command?
 *   is_simulated: boolean    // From AI Copilot?
 * }
 * 
 * 📌 HUMAN-IN-THE-LOOP:
 * AI/Voice orders have status="pending"
 * User must confirm in Orders tab before holdings update
 */
app.post("/newOrder", async (req, res) => {
  try {
    const { name, qty, price, mode, is_voice_order, is_simulated } = req.body;
    
    // Determine if order needs confirmation (AI/Voice orders need confirmation)
    const needsConfirmation = is_voice_order || is_simulated;
    
    // Save the order to MongoDB
    let newOrder = new OrdersModel({
      name,
      qty,
      price,
      mode,
      is_voice_order: is_voice_order || false,
      is_simulated: is_simulated || false,
      status: needsConfirmation ? "pending" : "executed",
      /**
       * 📖 Status field for Human-in-the-Loop
       * 
       * - "pending": AI/Voice order, waiting for user confirmation
       * - "executed": Manual order OR confirmed AI/Voice order
       * - "rejected": User rejected the AI/Voice order
       */
    });
    await newOrder.save();

    // Only update holdings for manual orders (executed immediately)
    // AI/Voice orders update holdings when confirmed
    if (!needsConfirmation) {
      try {
        await updateHoldings(name, qty, price, mode);
        console.log(`✅ Holdings updated for order: ${name} ${mode} ${qty} @ ${price}`);
      } catch (holdingsError) {
        console.error(`❌ Failed to update holdings for order ${newOrder._id}:`, holdingsError);
        // Order is saved, but holdings update failed - return warning
        return res.status(500).json({ 
          error: "Order placed but holdings update failed",
          order: newOrder,
          warning: "Please check Holdings page. If missing, use /repair-holdings endpoint."
        });
      }
    }

    res.json({ 
      message: needsConfirmation 
        ? "Order placed! Please confirm in Orders tab to execute." 
        : "Order placed and holdings updated!", 
      order: newOrder,
      needsConfirmation
    });
  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({ error: "Failed to place order" });
  }
});

/**
 * 📖 Helper Function: updateHoldings
 * 
 * Updates MongoDB holdings based on order
 * 
 * BUY:
 * - If stock exists: Update qty and recalculate average price
 * - If new stock: Create new holding entry
 * 
 * SELL:
 * - Decrease quantity
 * - If qty becomes 0: Delete the holding
 * 
 * @param {string} name - Stock name
 * @param {number} qty - Quantity
 * @param {number} price - Price per share
 * @param {string} mode - "buy" or "sell"
 */
/**
 * 📖 Helper Function: updateHoldings
 * 
 * Updates MongoDB holdings based on order
 * 
 * BUY:
 * - If stock exists: Update qty and recalculate average price
 * - If new stock: Create new holding entry
 * 
 * SELL:
 * - Decrease quantity
 * - If qty becomes 0: Delete the holding
 * 
 * ⚠️ SAFEGUARD: Added error handling and validation to ensure holdings are always created
 * 
 * @param {string} name - Stock name
 * @param {number} qty - Quantity
 * @param {number} price - Price per share
 * @param {string} mode - "buy" or "sell"
 * @returns {Promise<Object>} Created or updated holding
 * @throws {Error} If holdings update fails
 */
async function updateHoldings(name, qty, price, mode) {
  try {
    // Validate inputs
    if (!name || !qty || !price || !mode) {
      throw new Error(`Invalid parameters: name=${name}, qty=${qty}, price=${price}, mode=${mode}`);
    }

    const stockName = name.toUpperCase();
    const orderMode = mode.toLowerCase();

    if (orderMode === "buy") {
      // Check if user already holds this stock
      let existingHolding = await HoldingsModel.findOne({ name: stockName });
      
      if (existingHolding) {
        /**
         * 📖 Recalculate average price for BUY
         * 
         * Formula: newAvg = (oldQty * oldAvg + newQty * newPrice) / totalQty
         * 
         * Example:
         * Had: 10 shares @ ₹100 avg = ₹1000 total
         * Buy: 5 shares @ ₹120 = ₹600
         * New: 15 shares, total cost = ₹1600
         * New avg = 1600 / 15 = ₹106.67
         */
        const totalQty = existingHolding.qty + qty;
        const totalCost = (existingHolding.avg * existingHolding.qty) + (price * qty);
        const newAvg = totalCost / totalQty;
        
        existingHolding.qty = totalQty;
        existingHolding.avg = newAvg;
        existingHolding.price = price;  // Update current price
        await existingHolding.save();
        
        console.log(`✅ Updated holding: ${stockName} - Qty: ${totalQty}, Avg: ${newAvg.toFixed(2)}`);
        return existingHolding;
      } else {
        // New holding - first time buying this stock
        const newHolding = new HoldingsModel({
          name: stockName,
          qty,
          avg: price,  // First buy = avg price is buy price
          price,
          net: "0%",
          day: "0%",
        });
        await newHolding.save();
        
        console.log(`✅ Created new holding: ${stockName} - Qty: ${qty}, Price: ${price}`);
        return newHolding;
      }
    } else if (orderMode === "sell") {
      let existingHolding = await HoldingsModel.findOne({ name: stockName });
      
      if (existingHolding) {
        existingHolding.qty -= qty;
        
        if (existingHolding.qty <= 0) {
          // Sold all shares - remove holding
          await HoldingsModel.deleteOne({ name: stockName });
          console.log(`✅ Removed holding: ${stockName} (sold all shares)`);
          return null;
        } else {
          await existingHolding.save();
          console.log(`✅ Updated holding: ${stockName} - Remaining Qty: ${existingHolding.qty}`);
          return existingHolding;
        }
      } else {
        console.warn(`⚠️ Attempted to sell ${stockName} but no holding exists`);
        return null;
      }
    } else {
      throw new Error(`Invalid mode: ${mode}. Must be "buy" or "sell"`);
    }
  } catch (error) {
    console.error(`❌ Error updating holdings for ${name}:`, error);
    throw error;  // Re-throw to let caller handle it
  }
}

// =============================================================================
//                     ✅ ORDER CONFIRMATION (HUMAN-IN-THE-LOOP)
// =============================================================================

/**
 * 📖 POST /order/:id/confirm - Confirm a pending order
 * 
 * 🔗 HUMAN-IN-THE-LOOP FLOW:
 * 1. AI/Voice order created with status="pending"
 * 2. User sees order in Orders tab with "Confirm" button
 * 3. User clicks Confirm → This endpoint is called
 * 4. Holdings are updated, status changes to "executed"
 * 
 * This gives user final control over AI/Voice orders!
 * 
 * @param {string} id - MongoDB _id of the order
 */
app.post("/order/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrdersModel.findById(id);
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    if (order.status === "executed") {
      return res.status(400).json({ error: "Order already executed" });
    }
    
    // Update holdings (this is when the "trade" actually happens)
    try {
      const holding = await updateHoldings(order.name, order.qty, order.price, order.mode);
      console.log(`✅ Holdings updated for confirmed order: ${order.name} ${order.mode} ${order.qty} @ ${order.price}`);
      
      // Verify holding was created (for BUY orders)
      if (order.mode.toLowerCase() === "buy") {
        const verifyHolding = await HoldingsModel.findOne({ name: order.name.toUpperCase() });
        if (!verifyHolding) {
          console.error(`❌ CRITICAL: Holding not found after update for ${order.name}`);
          return res.status(500).json({ 
            error: "Order confirmed but holdings creation failed. Please use /repair-holdings endpoint.",
            order 
          });
        }
      }
    } catch (holdingsError) {
      console.error(`❌ Failed to update holdings for order ${order._id}:`, holdingsError);
      return res.status(500).json({ 
        error: "Failed to update holdings",
        details: holdingsError.message,
        order 
      });
    }
    
    // Update order status
    order.status = "executed";
    await order.save();
    
    res.json({ message: "Order confirmed and executed!", order });
  } catch (error) {
    console.error("Confirm order error:", error);
    res.status(500).json({ error: "Failed to confirm order" });
  }
});

/**
 * 📖 POST /repair-holdings - Repair missing holdings from executed orders
 * 
 * 🔧 SAFEGUARD ENDPOINT:
 * This endpoint checks all executed BUY orders and ensures holdings exist.
 * If a holding is missing for an executed order, it creates it.
 * 
 * This fixes the issue where holdings weren't created due to errors.
 * 
 * Usage: GET /repair-holdings
 * Response: { fixed: number, missing: array, message: string }
 */
app.get("/repair-holdings", async (req, res) => {
  try {
    // Find all executed BUY orders
    const executedBuyOrders = await OrdersModel.find({ 
      status: "executed",
      mode: { $regex: /^buy$/i }  // Case-insensitive match
    });
    
    let fixed = 0;
    const missing = [];
    
    for (const order of executedBuyOrders) {
      // Check if holding exists for this order
      const existingHolding = await HoldingsModel.findOne({ 
        name: order.name.toUpperCase() 
      });
      
      if (!existingHolding) {
        // Holding is missing - create it
        try {
          await updateHoldings(order.name, order.qty, order.price, order.mode);
          fixed++;
          missing.push({
            order_id: order._id,
            stock: order.name,
            qty: order.qty,
            price: order.price
          });
          console.log(`🔧 Fixed missing holding: ${order.name} from order ${order._id}`);
        } catch (error) {
          console.error(`❌ Failed to repair holding for ${order.name}:`, error);
          missing.push({
            order_id: order._id,
            stock: order.name,
            error: error.message
          });
        }
      }
    }
    
    res.json({
      message: `Repair complete. Fixed ${fixed} missing holdings.`,
      fixed,
      missing,
      total_checked: executedBuyOrders.length
    });
  } catch (error) {
    console.error("Repair holdings error:", error);
    res.status(500).json({ error: "Failed to repair holdings", details: error.message });
  }
});

/**
 * 📖 POST /order/:id/reject - Reject/Cancel a pending order
 * 
 * User decides NOT to execute the AI/Voice order
 * Holdings are NOT updated
 * 
 * @param {string} id - MongoDB _id of the order
 */
app.post("/order/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrdersModel.findById(id);
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    if (order.status === "executed") {
      return res.status(400).json({ error: "Cannot reject executed order" });
    }
    
    order.status = "rejected";
    await order.save();
    
    res.json({ message: "Order rejected", order });
  } catch (error) {
    console.error("Reject order error:", error);
    res.status(500).json({ error: "Failed to reject order" });
  }
});

// =============================================================================
//                     🤖 AI SERVICE PROXY ENDPOINTS
// =============================================================================

/**
 * 📖 Why Proxy?
 * 
 * Instead of frontend calling AI service directly:
 * Frontend → AI Service (BLOCKED by CORS, exposes AI service)
 * 
 * We use backend as proxy:
 * Frontend → Backend → AI Service (Secure, controlled)
 * 
 * Benefits:
 * 1. Security: AI service not exposed to internet
 * 2. Authentication: Backend can add API keys
 * 3. Logging: Backend can log all AI requests
 * 4. Transformation: Can modify request/response
 */

/**
 * 📖 POST /ai/detect-order - Detect if query is a buy/sell command
 * 
 * 🔗 FLOW:
 * Frontend (AICopilot.js):
 *   const result = await axios.post("/ai/detect-order", { query });
 *        ↓
 * Backend (This endpoint):
 *   Forward to AI Service
 *        ↓
 * AI Service (agent_service.py):
 *   Use GPT to parse: "Buy 10 TCS" → { action: "BUY", qty: 10, stock: "TCS" }
 * 
 * If is_order=true, frontend shows Human-in-the-Loop dialog
 */
app.post("/ai/detect-order", async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Forward to AI service
    const response = await axios.post(`${AI_SERVICE_URL}/agent/detect-order`, {
      query
    });

    res.json(response.data);
  } catch (error) {
    console.error("Order detection error:", error.message);
    res.status(500).json({ 
      error: "Order detection failed",
      message: error.response?.data?.detail || error.message 
    });
  }
});

/**
 * 📖 GET /ai/health - Check if AI service is running
 * 
 * Used by frontend to show AI service status
 */
app.get("/ai/health", async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      message: "AI service unavailable",
      error: error.message 
    });
  }
});

/**
 * 📖 POST /ai/stock-research - 7-node LangGraph stock analysis
 * 
 * 🔗 FLOW:
 * Frontend (AICopilot.js):
 *   User asks: "Tell me about Reliance stock"
 *   detectStockQuery() returns true
 *   axios.post("/ai/stock-research", { query })
 *        ↓
 * Backend (This endpoint):
 *   Forward to AI Service /agent/stock-research
 *        ↓
 * AI Service (agent_service.py → stock_graph.py):
 *   Runs 7-node LangGraph workflow:
 *   1. company_intro_node → What is Reliance?
 *   2. sector_analyst_node → Oil & Gas sector outlook
 *   3. company_researcher_node → MoneyControl, Screener data
 *   4. policy_watchdog_node → Government policies impact
 *   5. investor_sentiment_node → Analyst ratings, FII/DII
 *   6. technical_analysis_node → RSI, Moving Averages, RISK WARNINGS
 *   7. investment_suggestion_node → Buy/Sell/Hold recommendation
 *        ↓
 * Response contains all 7 analyses + final_recommendation (markdown)
 */
app.post("/ai/stock-research", async (req, res) => {
  try {
    const { query, company_name } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const response = await axios.post(`${AI_SERVICE_URL}/agent/stock-research`, {
      query,
      company_name
    });

    res.json(response.data);
  } catch (error) {
    console.error("Stock research error:", error.message);
    res.status(500).json({ 
      error: "Stock research failed",
      message: error.response?.data?.detail || error.message 
    });
  }
});

/**
 * 📖 POST /ai/chat - General AI chat with tools
 * 
 * For non-stock queries that don't need full 7-node workflow
 * Uses simpler agent with web search tool
 * 
 * 🔗 AI Service: /agent/smart-chat
 */
app.post("/ai/chat", async (req, res) => {
  try {
    const { query, thread_id = "default", user_id = "default" } = req.body;
    /**
     * 📖 thread_id & user_id
     * 
     * For conversation memory - same thread_id = same conversation
     * AI remembers previous messages in the thread
     */
    
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const response = await axios.post(`${AI_SERVICE_URL}/agent/smart-chat`, {
      query,
      thread_id,
      user_id
    });

    res.json(response.data);
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({ 
      error: "Chat failed",
      message: error.response?.data?.detail || error.message 
    });
  }
});

/**
 * 📖 POST /ai/transcribe - Voice to Text (OpenAI Whisper)
 * 
 * 🔗 FLOW:
 * Frontend (AICopilot.js):
 *   1. User clicks mic button
 *   2. MediaRecorder captures audio (WebM format)
 *   3. Audio sent as FormData
 *        ↓
 * Backend (This endpoint):
 *   1. multer parses file (req.file)
 *   2. Create new FormData with file buffer
 *   3. Forward to AI Service
 *        ↓
 * AI Service (tools_service.py):
 *   1. Receive file
 *   2. Call OpenAI Whisper API
 *   3. Return transcribed text
 *        ↓
 * Backend returns { text: "Buy 10 shares of TCS" }
 *        ↓
 * Frontend auto-sends transcribed text (triggers order detection)
 */
app.post("/ai/transcribe", upload.single("audio"), async (req, res) => {
  /**
   * 📖 upload.single("audio")
   * 
   * Multer middleware that:
   * 1. Looks for file in "audio" field
   * 2. Parses multipart/form-data
   * 3. Puts file in req.file
   * 
   * req.file structure:
   * {
   *   fieldname: 'audio',
   *   originalname: 'recording.webm',
   *   mimetype: 'audio/webm',
   *   buffer: <Buffer ...>,  // The actual audio data
   *   size: 12345
   * }
   */
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    // Create FormData to forward to AI service
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    /**
     * 📖 FormData for file upload
     * 
     * When forwarding file to another server:
     * 1. Create new FormData
     * 2. Append buffer (not file object)
     * 3. Specify filename and contentType
     */
    
    if (req.body.language) {
      formData.append("language", req.body.language);
    }

    const response = await axios.post(
      `${AI_SERVICE_URL}/stt/transcribe`,
      formData,
      {
        headers: {
          ...formData.getHeaders()  // Required for multipart
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Transcription error:", error.message);
    res.status(500).json({ 
      error: "Transcription failed",
      message: error.response?.data?.detail || error.message 
    });
  }
});

// =============================================================================
//                     💹 STOCK PRICE ENDPOINTS (Yahoo Finance)
// =============================================================================

/**
 * 📖 Stock Price Data Flow
 * 
 * Frontend → Backend (these endpoints) → AI Service → Yahoo Finance (yfinance)
 * 
 * Used for:
 * 1. TopBar: Nifty 50, Sensex prices
 * 2. WatchList: Individual stock prices
 * 3. BuyActionWindow: Current price for order dialog
 */

/**
 * 📖 GET /api/market-indices - Get Nifty 50 & Sensex
 * 
 * 🔗 AI Service uses:
 * yf.Ticker("^NSEI")  → Nifty 50
 * yf.Ticker("^BSESN") → Sensex
 * 
 * Response: { nifty: { price, change, changePercent }, sensex: { ... } }
 */
app.get("/api/market-indices", async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/tools/market-indices`);
    res.json(response.data);
  } catch (error) {
    console.error("Market indices error:", error.message);
    res.status(500).json({ 
      error: "Failed to fetch market indices",
      nifty: { price: null, change: 0 },
      sensex: { price: null, change: 0 }
    });
  }
});

/**
 * 📖 POST /api/stock-prices - Get multiple stock prices
 * 
 * For watchlist - get prices for all stocks at once
 * 
 * Request: { symbols: ["RELIANCE", "TCS", "INFY"] }
 * Response: { prices: { RELIANCE: 1532.40, TCS: 3258.50, ... } }
 */
app.post("/api/stock-prices", async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ error: "symbols array required" });
    }

    const response = await axios.post(`${AI_SERVICE_URL}/tools/stock-prices`, {
      symbols
    });
    res.json(response.data);
  } catch (error) {
    console.error("Stock prices error:", error.message);
    res.status(500).json({ 
      error: "Failed to fetch stock prices",
      prices: {}
    });
  }
});

/**
 * 📖 GET /api/stock-price/:symbol - Get single stock price
 * 
 * Used in BuyActionWindow for Human-in-the-Loop
 * Shows current price when placing order
 * 
 * 🔗 AI Service:
 * yf.Ticker(f"{symbol}.NS").info['currentPrice']
 * 
 * .NS = NSE (National Stock Exchange of India)
 */
app.get("/api/stock-price/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await axios.get(`${AI_SERVICE_URL}/tools/stock-price/${symbol}`);
    res.json(response.data);
  } catch (error) {
    console.error("Stock price error:", error.message);
    res.status(500).json({ 
      error: "Failed to fetch stock price",
      symbol: req.params.symbol,
      price: null
    });
  }
});

// =============================================================================
//                     📋 ORDER MANAGEMENT
// =============================================================================

/**
 * 📖 GET /allOrders - Get all orders
 * 
 * Returns orders sorted by newest first
 * 
 * 🔗 Frontend: Orders.js displays this in table
 * Shows: Time, Stock, Type (BUY/SELL), Qty, Price, Source, Status
 */
app.get("/allOrders", async (req, res) => {
  try {
    let allOrders = await OrdersModel.find({}).sort({ createdAt: -1 });
    res.json(allOrders);
  } catch (error) {
    console.error("Get orders error:", error.message);
    res.json([]);
  }
});

/**
 * 📖 GET /repair-orders - Create missing orders for existing holdings
 * 
 * 🔧 SAFEGUARD ENDPOINT:
 * This endpoint checks all holdings and creates corresponding orders if missing.
 * This fixes the issue where holdings exist but orders don't (e.g., from seedHoldings).
 * 
 * For each holding:
 * - Checks if an order exists for that stock
 * - If not, creates a "BUY" order with status="executed"
 * - Uses the holding's avg price and qty
 * 
 * Usage: GET /repair-orders
 * Response: { created: number, orders: array, message: string }
 */
app.get("/repair-orders", async (req, res) => {
  try {
    // Get all holdings
    const allHoldings = await HoldingsModel.find({});
    
    let created = 0;
    const createdOrders = [];
    
    for (const holding of allHoldings) {
      // Check if an order exists for this stock
      // Look for executed BUY orders with matching name
      const existingOrder = await OrdersModel.findOne({
        name: holding.name.toUpperCase(),
        mode: { $regex: /^buy$/i },
        status: "executed"
      });
      
      if (!existingOrder) {
        // Order is missing - create it
        try {
          const newOrder = new OrdersModel({
            name: holding.name.toUpperCase(),
            qty: holding.qty,
            price: holding.avg,  // Use average price from holding
            mode: "buy",
            is_voice_order: false,
            is_simulated: false,
            status: "executed",
            createdAt: new Date(),  // Set current date
            updatedAt: new Date()
          });
          
          await newOrder.save();
          created++;
          createdOrders.push({
            stock: holding.name,
            qty: holding.qty,
            price: holding.avg,
            order_id: newOrder._id
          });
          
          console.log(`🔧 Created missing order: ${holding.name} - Qty: ${holding.qty}, Price: ${holding.avg}`);
        } catch (error) {
          console.error(`❌ Failed to create order for ${holding.name}:`, error);
        }
      }
    }
    
    res.json({
      message: `Repair complete. Created ${created} missing orders.`,
      created,
      orders: createdOrders,
      total_holdings: allHoldings.length
    });
  } catch (error) {
    console.error("Repair orders error:", error);
    res.status(500).json({ error: "Failed to repair orders", details: error.message });
  }
});

/**
 * 📖 DELETE /order/:id - Delete an order
 * 
 * ⚠️ Be careful: This doesn't reverse holdings changes
 * Only use for cleanup of invalid orders
 */
app.delete("/order/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await OrdersModel.findByIdAndDelete(id);
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete order error:", error.message);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

/**
 * 📖 DELETE /orders/cleanup - Remove invalid orders
 * 
 * Cleans up orders with:
 * - No name
 * - Empty name
 * - Name = "-"
 * - Price = 0
 * 
 * Useful after testing or data corruption
 */
app.delete("/orders/cleanup", async (req, res) => {
  try {
    const result = await OrdersModel.deleteMany({
      $or: [
        { name: { $exists: false } },
        { name: null },
        { name: "" },
        { name: "-" },
        { price: 0 }
      ]
    });
    res.json({ message: `Cleaned up ${result.deletedCount} invalid orders` });
  } catch (error) {
    console.error("Cleanup error:", error.message);
    res.status(500).json({ error: "Failed to cleanup orders" });
  }
});

// =============================================================================
//                     🚀 START SERVER
// =============================================================================

// =============================================================================
//                     MONGODB CONNECTION (WITH PERSISTENCE)
// =============================================================================

/**
 * 📖 MongoDB Connection Setup
 * 
 * Ensures data persists across server restarts.
 * MongoDB stores data on disk, so data survives service restarts.
 * 
 * Connection options:
 * - useNewUrlParser: Use new URL parser (required for newer MongoDB)
 * - useUnifiedTopology: Use new connection management (recommended)
 */
mongoose.connect(uri || "mongodb://localhost:27017/zerodha", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ MongoDB connected successfully!");
  console.log("📊 Database: Data will persist across server restarts");
})
.catch((error) => {
  console.error("❌ MongoDB connection error:", error);
  console.error("⚠️  Make sure MongoDB is running: brew services start mongodb-community");
  process.exit(1);  // Exit if DB connection fails
});

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on('error', (error) => {
  console.error("❌ MongoDB error:", error);
});

// =============================================================================
//                     START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log("🚀 Backend server started on port", PORT);
  console.log("🔗 AI Service URL:", AI_SERVICE_URL);
  console.log("💾 MongoDB: Data persistence enabled");
});

/**
 * ===================================================================================
 *                     SUMMARY: API ENDPOINTS
 * ===================================================================================
 * 
 * 💰 HOLDINGS & POSITIONS:
 * GET  /allHoldings     → Get all stock holdings
 * GET  /allPositions    → Get all open positions
 * GET  /seedHoldings    → Initialize sample holdings
 * 
 * 🛒 ORDERS:
 * POST /newOrder        → Place new order (creates pending for AI/Voice)
 * GET  /allOrders       → Get all orders
 * POST /order/:id/confirm → Confirm pending order (Human-in-the-Loop)
 * POST /order/:id/reject  → Reject pending order
 * 
 * 🤖 AI SERVICE PROXY:
 * GET  /ai/health       → Check AI service status
 * POST /ai/stock-research → 7-node LangGraph stock analysis
 * POST /ai/chat         → General AI chat
 * POST /ai/transcribe   → Voice to text (Whisper)
 * POST /ai/detect-order → Parse buy/sell commands
 * 
 * 💹 STOCK PRICES:
 * GET  /api/market-indices    → Nifty 50 & Sensex
 * POST /api/stock-prices      → Multiple stock prices
 * GET  /api/stock-price/:sym  → Single stock price
 * 
 * ===================================================================================
 *                     INTERVIEW KEY POINTS
 * ===================================================================================
 * 
 * Q: "How does your backend connect frontend and AI service?"
 * A: "The backend acts as a proxy layer. It receives requests from the React
 *    frontend on port 3002, processes any business logic (like order management),
 *    and forwards AI-related requests to the FastAPI service on port 8000.
 *    This separation provides security and allows independent scaling."
 * 
 * Q: "Explain the Human-in-the-Loop for orders"
 * A: "When a user places an order through voice or AI, it's saved with
 *    status='pending'. The user must explicitly confirm in the Orders tab.
 *    On confirmation, /order/:id/confirm is called, which updates holdings.
 *    This prevents accidental trades and gives users control."
 * 
 * Q: "How do you handle file uploads (voice)?"
 * A: "I use Multer middleware with memoryStorage. The audio file is kept in
 *    memory as a Buffer, then forwarded to the AI service using FormData.
 *    This avoids writing temp files to disk."
 * 
 * ===================================================================================
 */
