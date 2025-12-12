/**
 * ===================================================================================
 *                     BUY ACTION WINDOW - Order Placement Modal 💰
 * ===================================================================================
 * 
 * 📚 WHAT IS THIS COMPONENT?
 * --------------------------
 * A modal window that appears when user wants to buy or sell stocks.
 * Used in:
 * - WatchList: When hovering over a stock and clicking "Buy" or "Sell"
 * - Holdings: When clicking "Buy" or "Sell" in the Trade column
 * 
 * 🔗 HOW IT CONNECTS:
 * ------------------
 *     User clicks Buy/Sell
 *           ↓
 *     BuyActionWindow opens
 *           ↓
 *     User enters quantity, selects Market/Limit
 *           ↓
 *     User clicks "Buy" or "Sell" button
 *           ↓
 *     POST /newOrder → Backend → MongoDB
 *           ↓
 *     Holdings updated (if manual order)
 * 
 * 📌 KEY FEATURES:
 * ----------------
 * 1. Auto-fetches current stock price from Yahoo Finance
 * 2. Market vs Limit order selection
 * 3. Quantity input with +/- buttons
 * 4. Order summary (value, charges, margin)
 * 5. Real-time price updates
 * 
 * ===================================================================================
 */

import React, { useState, useEffect, useContext } from "react";
/**
 * 📖 React Hooks:
 * - useState: Manage component state (quantity, price, loading)
 * - useEffect: Fetch price when component mounts
 * - useContext: Access GeneralContext for window management
 */

import axios from "axios";
/**
 * 📖 Axios - HTTP client
 * Used to:
 * - GET /api/stock-price/:symbol → Fetch current price
 * - POST /newOrder → Place the order
 */

import GeneralContext from "./GeneralContext";
/**
 * 📖 GeneralContext - React Context for global state
 * 
 * Provides:
 * - openBuyWindow() - Open buy window
 * - closeBuyWindow() - Close buy window
 * - openSellWindow() - Open sell window
 * 
 * This allows any component to open/close the buy/sell window
 */

import "./BuyActionWindow.css";

/**
 * 📖 BuyActionWindow Component
 * 
 * Props:
 * @param {string} uid - Stock name/symbol (e.g., "RELIANCE", "TCS")
 * @param {number} initialPrice - Initial price (if known, otherwise fetched)
 * @param {string} mode - "BUY" or "SELL"
 * @param {function} onClose - Optional callback when window closes
 * 
 * Usage:
 * <BuyActionWindow 
 *   uid="TCS" 
 *   initialPrice={3258.50} 
 *   mode="BUY" 
 *   onClose={() => console.log("Closed")}
 * />
 */
const BuyActionWindow = ({ uid, initialPrice = 0, mode = "BUY", onClose }) => {
  // ===========================================================================
  //                     STATE MANAGEMENT
  // ===========================================================================
  
  const [stockQuantity, setStockQuantity] = useState(1);
  /**
   * 📖 Quantity of shares to buy/sell
   * User can adjust with +/- buttons or type directly
   */

  const [stockPrice, setStockPrice] = useState(initialPrice);
  /**
   * 📖 Price per share
   * - If Market order: Uses current market price (fetched)
   * - If Limit order: User can set custom price
   */

  const [orderType, setOrderType] = useState("MARKET");
  /**
   * 📖 Order Type: "MARKET" or "LIMIT"
   * 
   * MARKET:
   * - Executes at current market price
   * - Price field is disabled (auto-filled)
   * - Faster execution
   * 
   * LIMIT:
   * - Executes only at user-specified price or better
   * - Price field is editable
   * - May not execute if price doesn't reach limit
   */

  const [loading, setLoading] = useState(false);
  /**
   * 📖 Loading state while placing order
   * Shows "Placing..." on button
   */

  const [fetchingPrice, setFetchingPrice] = useState(false);
  /**
   * 📖 Loading state while fetching current price
   * Shows "(fetching...)" next to price label
   */

  const [error, setError] = useState("");
  /**
   * 📖 Error message to display
   * Shown if order placement fails
   */

  // ===========================================================================
  //                     CONTEXT
  // ===========================================================================
  
  const generalContext = useContext(GeneralContext);
  /**
   * 📖 Access GeneralContext
   * Used to close window if onClose prop not provided
   */

  // ===========================================================================
  //                     EFFECT: FETCH CURRENT PRICE
  // ===========================================================================
  
  /**
   * 📖 useEffect - Fetch price when component mounts
   * 
   * Runs when:
   * - Component first renders
   * - uid changes (different stock selected)
   * - initialPrice changes
   * 
   * If initialPrice is 0 or not provided, fetches from API
   */
  useEffect(() => {
    if (!initialPrice || initialPrice === 0) {
      fetchCurrentPrice();
    } else {
      setStockPrice(initialPrice);
    }
  }, [uid, initialPrice]);

  /**
   * 📖 Fetch Current Stock Price
   * 
   * 🔗 API FLOW:
   * Frontend → GET /api/stock-price/:symbol (Backend)
   *      → GET /tools/stock-price/:symbol (AI Service)
   *      → Yahoo Finance (yfinance library)
   *      → Returns: { symbol, price, change, changePercent }
   * 
   * 📌 Why fetch price?
   * - Shows user current market price
   * - Auto-fills for Market orders
   * - User can see if price changed since opening window
   */
  const fetchCurrentPrice = async () => {
    setFetchingPrice(true);
    try {
      /**
       * 📖 encodeURIComponent
       * Encodes special characters in URL
       * "Tata Motors" → "Tata%20Motors"
       * Required for stock names with spaces!
       */
      const response = await axios.get(
        `http://localhost:3002/api/stock-price/${encodeURIComponent(uid)}`
      );
      if (response.data && response.data.price) {
        setStockPrice(response.data.price);
      }
    } catch (err) {
      console.error("Failed to fetch price:", err);
      // Price stays at 0 or initialPrice if fetch fails
    } finally {
      setFetchingPrice(false);
    }
  };

  // ===========================================================================
  //                     CALCULATIONS
  // ===========================================================================
  
  /**
   * 📖 Calculate Order Value
   * 
   * Formula: quantity × price per share
   * Example: 10 shares × ₹3,258.50 = ₹32,585.00
   */
  const marginRequired = (stockQuantity * stockPrice).toFixed(2);

  // ===========================================================================
  //                     ORDER PLACEMENT
  // ===========================================================================
  
  /**
   * 📖 Handle Order Button Click
   * 
   * FLOW:
   * 1. Validate quantity and price
   * 2. Show loading state
   * 3. POST to /newOrder endpoint
   * 4. Close window on success
   * 5. Show error if failed
   * 
   * 🔗 Backend (index.js):
   *   app.post("/newOrder", async (req, res) => {
   *     // Creates order in MongoDB
   *     // Updates holdings if manual order (not AI/Voice)
   *   });
   */
  const handleOrderClick = async () => {
    // Validation
    if (stockQuantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (stockPrice <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    setLoading(true);
    setError("");

    try {
      /**
       * 📖 POST /newOrder
       * 
       * Request body:
       * {
       *   name: "TCS",              // Stock name
       *   qty: 10,                  // Quantity
       *   price: 3258.50,           // Price per share
       *   mode: "buy" | "sell",     // Order type
       *   is_simulated: false,      // Manual order (not from AI)
       *   is_voice_order: false    // Not from voice command
       * }
       * 
       * Response:
       * {
       *   message: "Order placed and holdings updated!",
       *   order: { ... },
       *   needsConfirmation: false  // Manual orders execute immediately
       * }
       */
      await axios.post("http://localhost:3002/newOrder", {
        name: uid,
        qty: parseInt(stockQuantity),
        price: parseFloat(stockPrice),
        mode: mode.toLowerCase(),  // "BUY" → "buy"
        is_simulated: false,        // This is a manual order
        is_voice_order: false       // Not from voice
      });

      // Close window after successful order
      if (onClose) {
        onClose();
      } else {
        generalContext.closeBuyWindow();
      }
    } catch (err) {
      setError("Failed to place order. Please try again.");
      console.error("Order error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 📖 Handle Cancel Button Click
   * 
   * Closes the window without placing order
   */
  const handleCancelClick = () => {
    if (onClose) {
      onClose();
    } else {
      generalContext.closeBuyWindow();
    }
  };

  // ===========================================================================
  //                     RENDER
  // ===========================================================================
  
  const isBuy = mode === "BUY";

  return (
    <div className="order-overlay">
      {/* Modal overlay - darkens background */}
      <div className={`order-window ${isBuy ? 'buy-mode' : 'sell-mode'}`}>
        {/* ===== HEADER ===== */}
        <div className={`order-header ${isBuy ? 'buy-header' : 'sell-header'}`}>
          {/* Green gradient for BUY, Red gradient for SELL */}
          <div className="header-content">
            <h3>{uid}</h3>
            <span className="exchange-tag">NSE</span>
            {/* NSE = National Stock Exchange of India */}
          </div>
          
          {/* Order Type Selector (Market vs Limit) */}
          <div className="order-type-selector">
            <label className={orderType === 'MARKET' ? 'active' : ''}>
              <input 
                type="radio" 
                name="orderType" 
                value="MARKET"
                checked={orderType === 'MARKET'}
                onChange={(e) => setOrderType(e.target.value)}
              />
              Market
            </label>
            <label className={orderType === 'LIMIT' ? 'active' : ''}>
              <input 
                type="radio" 
                name="orderType" 
                value="LIMIT"
                checked={orderType === 'LIMIT'}
                onChange={(e) => setOrderType(e.target.value)}
              />
              Limit
            </label>
          </div>
        </div>

        {/* ===== BODY ===== */}
        <div className="order-body">
          <div className="order-inputs">
            {/* Quantity Input */}
            <div className="input-group">
              <label>Quantity</label>
              <div className="input-wrapper">
                {/* Decrease button */}
                <button 
                  className="qty-btn"
                  onClick={() => setStockQuantity(Math.max(1, stockQuantity - 1))}
                  /**
                   * 📖 Math.max(1, ...)
                   * Ensures quantity never goes below 1
                   */
                >
                  −
                </button>
                {/* Quantity input */}
                <input
                  type="number"
                  min="1"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 1)}
                  /**
                   * 📖 parseInt(e.target.value) || 1
                   * Converts string to number, defaults to 1 if invalid
                   */
                />
                {/* Increase button */}
                <button 
                  className="qty-btn"
                  onClick={() => setStockQuantity(stockQuantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Input */}
            <div className="input-group">
              <label>
                Price {fetchingPrice && <span className="fetching">(fetching...)</span>}
              </label>
              <div className="input-wrapper price-wrapper">
                <span className="currency">₹</span>
                <input
                  type="number"
                  step="0.05"
                  value={stockPrice}
                  onChange={(e) => setStockPrice(parseFloat(e.target.value) || 0)}
                  disabled={orderType === 'MARKET'}
                  /**
                   * 📖 Disabled for Market orders
                   * Market orders use current price automatically
                   * User can only set price for Limit orders
                   */
                />
              </div>
              {orderType === 'MARKET' && (
                <span className="market-note">Market price</span>
              )}
            </div>
          </div>

          {/* ===== ORDER SUMMARY ===== */}
          <div className="order-summary">
            <div className="summary-row">
              <span>Order Value</span>
              <span className="value">₹{marginRequired}</span>
              {/* quantity × price */}
            </div>
            <div className="summary-row">
              <span>Charges (approx.)</span>
              <span className="value">₹{(marginRequired * 0.001).toFixed(2)}</span>
              {/* 0.1% brokerage charges (example) */}
            </div>
            <div className="summary-row total">
              <span>Margin Required</span>
              <span className="value">₹{(parseFloat(marginRequired) * 1.001).toFixed(2)}</span>
              {/* Order value + charges */}
            </div>
          </div>

          {/* Error message */}
          {error && <div className="error-message">{error}</div>}
        </div>

        {/* ===== FOOTER ===== */}
        <div className="order-footer">
          {/* Buy/Sell Button */}
          <button 
            className={`order-btn ${isBuy ? 'buy-btn' : 'sell-btn'}`}
            onClick={handleOrderClick}
            disabled={loading}
            /**
             * 📖 Disabled during loading
             * Prevents double-submission
             */
          >
            {loading ? 'Placing...' : (isBuy ? 'Buy' : 'Sell')}
          </button>
          
          {/* Cancel Button */}
          <button 
            className="cancel-btn"
            onClick={handleCancelClick}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyActionWindow;

/**
 * ===================================================================================
 *                     SUMMARY: HOW THIS COMPONENT WORKS
 * ===================================================================================
 * 
 * 🔗 COMPLETE FLOW:
 * 
 * 1. User clicks "Buy" or "Sell" (from WatchList or Holdings)
 *    ↓
 * 2. BuyActionWindow opens with stock name
 *    ↓
 * 3. useEffect triggers → fetchCurrentPrice()
 *    → GET /api/stock-price/:symbol
 *    → AI Service → Yahoo Finance
 *    → Price auto-filled
 *    ↓
 * 4. User adjusts quantity (with +/- or typing)
 *    User selects Market (auto price) or Limit (custom price)
 *    ↓
 * 5. User clicks "Buy" or "Sell" button
 *    ↓
 * 6. handleOrderClick() validates and sends:
 *    POST /newOrder { name, qty, price, mode }
 *    ↓
 * 7. Backend creates order in MongoDB
 *    Backend updates holdings (if manual order)
 *    ↓
 * 8. Window closes, user sees updated holdings/orders
 * 
 * 📌 KEY CONCEPTS:
 * 
 * - Market Order: Executes at current market price (faster)
 * - Limit Order: Executes only at specified price (more control)
 * - Auto-price fetch: Shows user current market price
 * - Real-time calculations: Order value updates as user changes quantity
 * 
 * 📌 INTERVIEW: "How does the buy/sell window work?"
 * 
 * "It's a modal component that opens when users want to trade. It auto-fetches
 * the current stock price from Yahoo Finance via our backend. Users can choose
 * between Market orders (current price) or Limit orders (custom price). The
 * component calculates order value, charges, and margin in real-time. When the
 * user confirms, it sends a POST request to /newOrder, which creates the order
 * in MongoDB and updates holdings immediately for manual orders."
 * 
 * ===================================================================================
 */
