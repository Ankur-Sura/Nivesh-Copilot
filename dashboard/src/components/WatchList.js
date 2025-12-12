/**
 * ===================================================================================
 *                     WATCHLIST COMPONENT - Real-Time Stock Tracker 📊
 * ===================================================================================
 * 
 * 📚 WHAT IS THIS COMPONENT?
 * --------------------------
 * WatchList is the left sidebar of the Nivesh Copilot dashboard.
 * It displays stocks the user is tracking with live price updates.
 * 
 * 🔗 HOW IT CONNECTS TO OTHER PARTS:
 * ----------------------------------
 * 
 *     WatchList.js (This file)
 *           │
 *           ├── Fetches prices from → Backend (port 3002)
 *           │                              ↓
 *           │                         AI Service → Yahoo Finance
 *           │
 *           └── On Buy/Sell click → GeneralContext → BuyActionWindow
 * 
 * 📌 KEY FEATURES:
 * ----------------
 * 1. Real-time stock prices (Yahoo Finance via backend)
 * 2. Color-coded price changes (green ↑, red ↓)
 * 3. Hover actions (Buy/Sell buttons appear on hover)
 * 4. Search functionality
 * 5. Stock limit counter (X / 50)
 * 
 * 📌 INTERVIEW KEY POINTS:
 * -----------------------
 * "The WatchList uses React's useEffect to fetch live prices on component mount.
 * It uses Context API (GeneralContext) to trigger the Buy/Sell modal from any
 * stock item. The parent-child communication is: WatchList → WatchListItem → 
 * WatchListActions → GeneralContext → BuyActionWindow."
 * 
 * ===================================================================================
 *                           COMPONENT HIERARCHY
 * ===================================================================================
 * 
 *     WatchList (Container)
 *         │
 *         ├── Search Input (stock search)
 *         │
 *         └── <ul> List of stocks
 *                 │
 *                 └── WatchListItem (for each stock)
 *                         │
 *                         ├── Stock name
 *                         ├── Price & Change %
 *                         │
 *                         └── WatchListActions (on hover)
 *                                 │
 *                                 ├── Buy Button → GeneralContext.openBuyWindow()
 *                                 └── Sell Button → GeneralContext.openSellWindow()
 * 
 * ===================================================================================
 */

// =============================================================================
//                           IMPORTS SECTION
// =============================================================================

import React, { useState, useContext, useEffect } from "react";
/**
 * 📖 React Hooks Used:
 * 
 * - useState: Manage local state (watchlist data, loading state)
 * - useContext: Access GeneralContext for opening Buy/Sell windows
 * - useEffect: Fetch prices when component mounts
 * 
 * 📌 PATTERN (from your notes):
 *     const [data, setData] = useState(initialValue);
 *     useEffect(() => { // runs on mount }, []);
 */

import axios from "axios";
/**
 * 📖 Axios - HTTP Client
 * 
 * Used to fetch stock prices from backend:
 *   POST http://localhost:3002/api/stock-prices
 *   Body: { symbols: ["RELIANCE", "TCS", "INFY"] }
 *   Response: { prices: { RELIANCE: { price: 2850, change: 1.5 }, ... } }
 */

import GeneralContext from "./GeneralContext";
/**
 * 📖 GeneralContext - React Context for Global State
 * 
 * Provides functions to open Buy/Sell windows from any component.
 * This is how WatchListActions communicates with BuyActionWindow.
 * 
 * 🔗 Pattern: Context API for cross-component communication
 */

import { Tooltip, Grow } from "@mui/material";
/**
 * 📖 Material-UI Components
 * 
 * - Tooltip: Shows hint text on hover (e.g., "Buy (B)")
 * - Grow: Animation effect when tooltip appears
 */

import {
  KeyboardArrowDown,
  KeyboardArrowUp,
} from "@mui/icons-material";
/**
 * 📖 Material-UI Icons
 * 
 * - KeyboardArrowUp (↑): Shown when stock price is UP (green)
 * - KeyboardArrowDown (↓): Shown when stock price is DOWN (red)
 */

import { watchlist as staticWatchlist } from "../data/data";
/**
 * 📖 Static Watchlist Data
 * 
 * Initial list of stocks to display (before prices are fetched).
 * Located in: src/data/data.js
 * 
 * Structure:
 *   [
 *     { name: "RELIANCE", percent: "+0.5%", isDown: false, price: 0 },
 *     { name: "TCS", percent: "-1.2%", isDown: true, price: 0 },
 *     ...
 *   ]
 */

// =============================================================================
//                           MAIN WATCHLIST COMPONENT
// =============================================================================

/**
 * 📖 WatchList Component
 * 
 * The main container for the stock watchlist.
 * Handles price fetching and renders WatchListItems.
 * 
 * 📌 LIFECYCLE:
 * 1. Component mounts
 * 2. useEffect triggers → fetchPrices()
 * 3. Backend returns live prices
 * 4. watchlist state updated with real prices
 * 5. Component re-renders with live data
 */
const WatchList = () => {
  // ===========================================================================
  //                     STATE MANAGEMENT
  // ===========================================================================
  
  const [watchlist, setWatchlist] = useState(staticWatchlist);
  /**
   * 📖 watchlist State
   * 
   * Array of stock objects. Starts with static data, then updated with live prices.
   * 
   * Each stock object:
   * {
   *   name: "RELIANCE",     // Stock symbol
   *   percent: "+1.5%",     // Change percentage (string)
   *   isDown: false,        // true if price decreased
   *   price: 2850.25        // Current price (number)
   * }
   */

  const [loading, setLoading] = useState(true);
  /**
   * 📖 loading State
   * 
   * true → Show "..." instead of prices (data being fetched)
   * false → Show actual prices
   */

  // ===========================================================================
  //                     SIDE EFFECTS (useEffect)
  // ===========================================================================

  useEffect(() => {
    /**
     * 📖 Price Fetching Effect
     * 
     * Runs ONCE when component mounts (empty dependency array []).
     * 
     * Flow:
     * 1. Extract all stock symbols from staticWatchlist
     * 2. POST to backend /api/stock-prices
     * 3. Backend calls Yahoo Finance for each symbol
     * 4. Update watchlist with real prices
     * 
     * 📌 WHY POST instead of GET?
     * We're sending a list of symbols in the body.
     * POST is better for sending complex data.
     */
    const fetchPrices = async () => {
      try {
        // Extract symbol names from static watchlist
        const symbols = staticWatchlist.map(s => s.name);
        
        // Call backend to get prices
        const response = await axios.post("http://localhost:3002/api/stock-prices", {
          symbols
        });

        // If prices returned, update watchlist
        if (response.data.prices) {
          const updatedWatchlist = staticWatchlist.map(stock => {
            const priceData = response.data.prices[stock.name];
            
            if (priceData && priceData.price) {
              // Update stock with real price data
              return {
                ...stock,  // Spread: keep all existing properties
                price: priceData.price,
                percent: priceData.change 
                  ? `${priceData.change >= 0 ? '+' : ''}${priceData.change.toFixed(2)}%` 
                  : stock.percent,
                isDown: priceData.change ? priceData.change < 0 : stock.isDown
              };
            }
            return stock;  // If no price data, keep original
          });
          
          setWatchlist(updatedWatchlist);
        }
      } catch (error) {
        console.error("Failed to fetch stock prices:", error);
        // On error, keep static data (graceful degradation)
      } finally {
        setLoading(false);  // Always stop loading indicator
      }
    };

    fetchPrices();
  }, []);  // Empty array = run once on mount

  // ===========================================================================
  //                     RENDER
  // ===========================================================================

  return (
    <div 
      className="watchlist-container" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        overflow: 'hidden' 
      }}
    >
      {/* ================= SEARCH INPUT ================= */}
      <div 
        className="search-container" 
        style={{ flexShrink: 0, padding: '12px' }}
      >
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search eg:infy, bse, nifty fut weekly, gold mcx"
          className="search"
          style={{ 
            width: '100%', 
            padding: '10px 12px', 
            borderRadius: '6px', 
            border: '1px solid #333',
            background: '#252540',
            color: '#fff',
            fontSize: '0.85rem'
          }}
        />
        {/* Stock count indicator (X / 50) */}
        <span 
          className="counts" 
          style={{ 
            display: 'block', 
            textAlign: 'right', 
            fontSize: '0.75rem', 
            color: '#888',
            marginTop: '6px'
          }}
        >
          {watchlist.length} / 50
        </span>
      </div>

      {/* ================= STOCK LIST ================= */}
      <ul 
        className="list" 
        style={{ 
          flex: '1', 
          overflow: 'auto', 
          minHeight: 0, 
          margin: 0, 
          padding: '0 8px',
          listStyle: 'none'
        }}
      >
        {watchlist.map((stock, index) => {
          return <WatchListItem stock={stock} key={index} loading={loading} />;
        })}
      </ul>
    </div>
  );
};

export default WatchList;

// =============================================================================
//                           WATCHLIST ITEM COMPONENT
// =============================================================================

/**
 * 📖 WatchListItem Component
 * 
 * Renders a single stock in the watchlist.
 * Shows Buy/Sell buttons on hover.
 * 
 * Props:
 * @param {Object} stock - Stock data { name, price, percent, isDown }
 * @param {boolean} loading - True if prices are still loading
 * 
 * 📌 STATE:
 * - showWatchlistActions: Controls visibility of Buy/Sell buttons
 * 
 * 📌 EVENTS:
 * - onMouseEnter: Show action buttons
 * - onMouseLeave: Hide action buttons
 */
const WatchListItem = ({ stock, loading }) => {
  const [showWatchlistActions, setShowWatchlistActions] = useState(false);
  /**
   * Controls whether Buy/Sell buttons are visible.
   * true → Show buttons
   * false → Hide buttons (default)
   */

  const handleMouseEnter = (e) => {
    setShowWatchlistActions(true);
  };

  const handleMouseLeave = (e) => {
    setShowWatchlistActions(false);
  };

  /**
   * 📖 formatPrice Helper
   * 
   * Formats price for Indian locale (e.g., 2,850.25)
   * Returns "---" if price is not available
   */
  const formatPrice = (price) => {
    if (!price) return "---";
    return price.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  return (
    <li onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="item">
        {/* Stock Name (colored based on up/down) */}
        <p className={stock.isDown ? "down" : "up"}>{stock.name}</p>
        
        <div className="itemInfo">
          {/* Change Percentage */}
          <span className={`percent ${stock.isDown ? 'down' : 'up'}`}>
            {loading ? "..." : stock.percent}
          </span>
          
          {/* Arrow Icon (Up/Down) */}
          {stock.isDown ? (
            <KeyboardArrowDown className="down" />
          ) : (
            <KeyboardArrowUp className="up" />
          )}
          
          {/* Current Price */}
          <span className="price">
            {loading ? "..." : formatPrice(stock.price)}
          </span>
        </div>
      </div>
      
      {/* Buy/Sell Buttons (shown on hover) */}
      {showWatchlistActions && <WatchListActions uid={stock.name} price={stock.price} />}
    </li>
  );
};

// =============================================================================
//                           WATCHLIST ACTIONS COMPONENT
// =============================================================================

/**
 * 📖 WatchListActions Component
 * 
 * Buy and Sell buttons that appear when hovering over a stock.
 * Uses GeneralContext to trigger the BuyActionWindow modal.
 * 
 * Props:
 * @param {string} uid - Stock symbol (e.g., "RELIANCE")
 * @param {number} price - Current stock price
 * 
 * 📌 FLOW:
 * 1. User hovers over stock → WatchListActions appears
 * 2. User clicks "Buy" → handleBuyClick()
 * 3. handleBuyClick() calls generalContext.openBuyWindow(uid, price)
 * 4. GeneralContext updates state → BuyActionWindow renders
 * 5. User fills in order details → Order placed
 * 
 * 📌 INTERVIEW POINT:
 * "I use React Context API for state management. When user clicks Buy in the 
 * WatchList, it triggers a context method that opens the BuyActionWindow modal.
 * This avoids prop drilling through multiple component levels."
 */
const WatchListActions = ({ uid, price }) => {
  // Access the GeneralContext to get window control functions
  const generalContext = useContext(GeneralContext);

  /**
   * 📖 handleBuyClick
   * 
   * Opens BuyActionWindow in BUY mode with stock details.
   * The price is passed so the modal doesn't need to fetch it again.
   */
  const handleBuyClick = () => {
    generalContext.openBuyWindow(uid, price);
  };

  /**
   * 📖 handleSellClick
   * 
   * Opens BuyActionWindow in SELL mode with stock details.
   */
  const handleSellClick = () => {
    generalContext.openSellWindow(uid, price);
  };

  return (
    <span className="actions">
      <span>
        {/* ================= BUY BUTTON ================= */}
        <Tooltip
          title="Buy (B)"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <button className="buy" onClick={handleBuyClick}>Buy</button>
        </Tooltip>
        
        {/* ================= SELL BUTTON ================= */}
        <Tooltip
          title="Sell (S)"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <button className="sell" onClick={handleSellClick}>Sell</button>
        </Tooltip>
      </span>
    </span>
  );
};

/**
 * ===================================================================================
 *                           📌 SUMMARY & CHEAT SHEET
 * ===================================================================================
 * 
 * 🎯 COMPONENT STRUCTURE:
 * -----------------------
 * WatchList (Container)
 *   └── WatchListItem × N (one per stock)
 *         └── WatchListActions (Buy/Sell buttons, shown on hover)
 * 
 * 🎯 DATA FLOW:
 * -------------
 * 1. staticWatchlist (data.js) → initial stock list
 * 2. useEffect → fetch live prices from backend
 * 3. Backend → Yahoo Finance → returns prices
 * 4. setWatchlist(updatedPrices) → re-render with live data
 * 
 * 🎯 CONTEXT USAGE:
 * -----------------
 * WatchListActions uses GeneralContext to trigger BuyActionWindow:
 *   generalContext.openBuyWindow(uid, price)
 *   generalContext.openSellWindow(uid, price)
 * 
 * 🎯 KEY PATTERNS:
 * ----------------
 * 1. useState for local state
 * 2. useEffect for data fetching
 * 3. useContext for cross-component communication
 * 4. Conditional rendering (showWatchlistActions && <Component />)
 * 5. Map rendering (watchlist.map(stock => <WatchListItem />))
 * 
 * 🎯 INTERVIEW QUESTIONS:
 * -----------------------
 * Q: "How do you handle real-time stock prices?"
 * A: "I use useEffect to fetch prices on component mount. The backend 
 *    proxies requests to Yahoo Finance API. I update state with live 
 *    prices using the spread operator to preserve existing properties."
 * 
 * Q: "How do Buy/Sell buttons communicate with the modal?"
 * A: "I use React Context API. WatchListActions calls context.openBuyWindow(),
 *    which updates state in GeneralContext. This triggers BuyActionWindow to
 *    render with the stock details as props."
 * 
 * ===================================================================================
 */
