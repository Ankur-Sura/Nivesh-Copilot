/**
 * ===================================================================================
 *                     HOLDINGS COMPONENT - Portfolio View 💼
 * ===================================================================================
 * 
 * 📚 WHAT IS THIS COMPONENT?
 * --------------------------
 * Holdings displays the user's stock portfolio - all the shares they own.
 * It shows:
 * - Stock name and quantity
 * - Average buy price and current price
 * - Profit/Loss for each stock
 * - Total portfolio value and P&L
 * - Buy/Sell buttons for quick trading
 * 
 * 🔗 HOW IT CONNECTS TO OTHER PARTS:
 * ----------------------------------
 * 
 *     Holdings.js (This file)
 *           │
 *           ├── GET /allHoldings → Backend → MongoDB → Holdings Collection
 *           │
 *           └── POST /newOrder → Backend → Updates Holdings
 * 
 * 📌 KEY FEATURES:
 * ----------------
 * 1. Real-time holdings from MongoDB
 * 2. Auto-refresh every 30 seconds
 * 3. P&L calculations (per stock and total)
 * 4. In-page trade modal for quick Buy/Sell
 * 5. Visual chart of holdings (VerticalGraph)
 * 6. Sell quantity validation (can't sell more than owned)
 * 
 * 📌 INTERVIEW KEY POINTS:
 * -----------------------
 * "The Holdings component fetches data from MongoDB via the backend API.
 * I implemented real-time updates using setInterval for auto-refresh.
 * Users can trade directly from holdings with quantity validation -
 * the system prevents selling more shares than owned."
 * 
 * ===================================================================================
 *                           DATA FLOW
 * ===================================================================================
 * 
 *     MongoDB (Holdings Collection)
 *           │
 *           ├── Document: { name: "TCS", qty: 10, avg: 3200, price: 3250, net: "+1.5%" }
 *           │
 *           └── Document: { name: "RELIANCE", qty: 5, avg: 2800, price: 2750, net: "-1.8%" }
 *           │
 *           ▼
 *     Backend (GET /allHoldings)
 *           │
 *           ▼
 *     Holdings.js (This file)
 *           │
 *           ├── Calculates: Investment, Current Value, P&L
 *           │
 *           └── Renders: Table + Graph + Trade Modal
 * 
 * ===================================================================================
 */

// =============================================================================
//                           IMPORTS SECTION
// =============================================================================

import React, { useState, useEffect } from "react";
/**
 * 📖 React Hooks:
 * 
 * - useState: Manage local state (holdings, loading, modal data)
 * - useEffect: Fetch data on mount and set up auto-refresh interval
 */

import axios from "axios";
/**
 * 📖 Axios - HTTP Client
 * 
 * Used for:
 * - GET http://localhost:3002/allHoldings → Fetch all holdings
 * - POST http://localhost:3002/newOrder → Place a trade order
 */

import { Link } from "react-router-dom";
/**
 * 📖 React Router Link
 * 
 * Used for navigation to Orders page when pending orders are detected.
 */

import { VerticalGraph } from "./VerticalGraph";
/**
 * 📖 VerticalGraph Component
 * 
 * A bar chart showing stock prices visually.
 * Uses Chart.js library under the hood.
 */

// =============================================================================
//                           MAIN HOLDINGS COMPONENT
// =============================================================================

/**
 * 📖 Holdings Component
 * 
 * Displays user's stock portfolio with trading functionality.
 * 
 * 📌 STATE:
 * - allHoldings: Array of holding objects from MongoDB
 * - loading: Boolean for loading indicator
 * - tradeModal: Object { stock, mode } when modal is open, null when closed
 * - tradeQty: Number of shares to trade
 * - tradePrice: Price per share for the trade
 * - tradingLoading: Boolean while placing order
 */
const Holdings = () => {
  // ===========================================================================
  //                     STATE MANAGEMENT
  // ===========================================================================
  
  const [allHoldings, setAllHoldings] = useState([]);
  /**
   * 📖 allHoldings State
   * 
   * Array of holding objects from MongoDB.
   * Each holding:
   * {
   *   _id: "mongodb_id",
   *   name: "TCS",          // Stock symbol
   *   qty: 10,              // Quantity owned
   *   avg: 3200.50,         // Average buy price
   *   price: 3250.75,       // Current market price
   *   net: "+1.5%"          // Net change (string)
   * }
   */

  const [loading, setLoading] = useState(true);
  /**
   * 📖 loading State
   * 
   * true → Show loading indicator
   * false → Show holdings table
   */

  const [tradeModal, setTradeModal] = useState(null);
  /**
   * 📖 tradeModal State
   * 
   * null → Modal is closed
   * { stock, mode } → Modal is open for trading
   *   - stock: The holding object being traded
   *   - mode: "BUY" or "SELL"
   */

  const [tradeQty, setTradeQty] = useState(1);
  /**
   * 📖 tradeQty State
   * 
   * Number of shares to buy/sell in the trade modal.
   * Default: 1
   */

  const [tradePrice, setTradePrice] = useState(0);
  /**
   * 📖 tradePrice State
   * 
   * Price per share for the trade.
   * Initialized to current market price when modal opens.
   */

  const [tradingLoading, setTradingLoading] = useState(false);
  /**
   * 📖 tradingLoading State
   * 
   * true → Order is being placed (show "Placing..." on button)
   * false → Ready for user action
   */

  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  /**
   * 📖 pendingOrdersCount State
   * 
   * Number of pending orders that need confirmation.
   * Used to show warning banner if holdings are missing due to unconfirmed orders.
   */

  // ===========================================================================
  //                     DATA FETCHING
  // ===========================================================================

  /**
   * 📖 fetchHoldings Function
   * 
   * Fetches all holdings from the backend API.
   * Called on component mount and every 30 seconds.
   * 
   * API: GET http://localhost:3002/allHoldings
   * Response: Array of holding objects
   */
  const fetchHoldings = async () => {
    try {
      const res = await axios.get("http://localhost:3002/allHoldings");
      setAllHoldings(res.data);
    } catch (error) {
      console.error("Error fetching holdings:", error);
    } finally {
      setLoading(false);  // Always stop loading, even on error
    }
  };

  /**
   * 📖 fetchPendingOrders Function
   * 
   * Checks for pending orders that need confirmation.
   * This helps users understand why holdings might be missing.
   * 
   * API: GET http://localhost:3002/allOrders
   * Filters orders with status="pending"
   */
  const fetchPendingOrders = async () => {
    try {
      const res = await axios.get("http://localhost:3002/allOrders");
      const pending = res.data.filter(order => order.status === "pending");
      setPendingOrdersCount(pending.length);
    } catch (error) {
      console.error("Error fetching pending orders:", error);
    }
  };

  // ===========================================================================
  //                     SIDE EFFECTS (useEffect)
  // ===========================================================================

  useEffect(() => {
    /**
     * 📖 Holdings Fetching Effect
     * 
     * Runs on component mount:
     * 1. Fetch holdings immediately
     * 2. Check for pending orders (to show warning if needed)
     * 3. Set up 30-second interval for auto-refresh
     * 4. Clean up interval on unmount
     * 
     * 📌 WHY AUTO-REFRESH?
     * Stock prices change constantly. We refresh every 30 seconds
     * to show updated P&L without requiring manual refresh.
     * 
     * 📌 WHY CHECK PENDING ORDERS?
     * If holdings are missing, it might be because orders are pending
     * and need confirmation. This helps users understand the issue.
     */
    fetchHoldings();
    fetchPendingOrders();  // Check for pending orders
    
    // Set up auto-refresh interval
    const interval = setInterval(() => {
      fetchHoldings();
      fetchPendingOrders();  // Also check pending orders periodically
    }, 30000);  // 30 seconds

    // Listen for manual refresh events (from Orders page after confirmation/repair)
    const handleRefresh = () => {
      fetchHoldings();
      fetchPendingOrders();
    };
    window.addEventListener('holdings-refresh', handleRefresh);
    
    // Cleanup function - runs when component unmounts
    return () => {
      clearInterval(interval);
      window.removeEventListener('holdings-refresh', handleRefresh);
    };
  }, []);  // Empty array = run once on mount

  // ===========================================================================
  //                     TRADE MODAL HANDLERS
  // ===========================================================================

  /**
   * 📖 openTradeModal
   * 
   * Opens the trade modal for buying or selling a stock.
   * 
   * @param {Object} stock - The holding to trade
   * @param {string} mode - "BUY" or "SELL"
   */
  const openTradeModal = (stock, mode) => {
    setTradeModal({ stock, mode });
    setTradeQty(1);                    // Reset quantity to 1
    setTradePrice(stock.price);        // Use current market price
  };

  /**
   * 📖 closeTradeModal
   * 
   * Closes the trade modal and resets all modal state.
   */
  const closeTradeModal = () => {
    setTradeModal(null);
    setTradeQty(1);
    setTradePrice(0);
  };

  /**
   * 📖 executeTrade
   * 
   * Places the buy/sell order via the backend API.
   * 
   * FLOW:
   * 1. Validate inputs (quantity, sell limit)
   * 2. POST to /newOrder with order details
   * 3. Backend updates MongoDB (orders + holdings)
   * 4. Refresh holdings to show updated data
   * 5. Close modal and show success message
   * 
   * 📌 SELL VALIDATION:
   * Cannot sell more shares than owned. This is enforced here
   * AND in the backend for double validation.
   */
  const executeTrade = async () => {
    if (!tradeModal) return;
    
    const { stock, mode } = tradeModal;
    
    // Validate sell quantity - can't sell more than owned
    if (mode === 'SELL' && tradeQty > stock.qty) {
      alert(`Cannot sell more than ${stock.qty} shares of ${stock.name}`);
      return;
    }
    
    // Validate quantity is positive
    if (tradeQty <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    setTradingLoading(true);
    try {
      // Place the order via backend
      await axios.post("http://localhost:3002/newOrder", {
        name: stock.name,
        qty: tradeQty,
        price: tradePrice,
        mode: mode,
        is_simulated: false,     // Not from AI
        is_voice_order: false,   // Not from voice command
      });
      
      closeTradeModal();
      fetchHoldings();  // Refresh holdings to show updated quantities
      fetchPendingOrders();  // Also refresh pending orders count
      alert(`${mode} order placed successfully!`);
    } catch (error) {
      console.error("Trade error:", error);
      alert("Failed to place order");
    } finally {
      setTradingLoading(false);
    }
  };

  // ===========================================================================
  //                     CALCULATIONS
  // ===========================================================================

  /**
   * 📖 Portfolio Calculations
   * 
   * Calculate total investment, current value, and P&L
   * using JavaScript reduce() for efficient array processing.
   * 
   * Formula:
   * - Investment = Σ (avg × qty) for each stock
   * - Current Value = Σ (price × qty) for each stock
   * - P&L = Current Value - Investment
   * - P&L % = (P&L / Investment) × 100
   */
  const totalInvestment = allHoldings.reduce(
    (sum, stock) => sum + (stock.avg * stock.qty), 
    0  // Initial value
  );

  const currentValue = allHoldings.reduce(
    (sum, stock) => sum + (stock.price * stock.qty), 
    0
  );

  const totalPnL = currentValue - totalInvestment;
  
  const pnlPercent = totalInvestment > 0 
    ? ((totalPnL / totalInvestment) * 100).toFixed(2) 
    : 0;

  // ===========================================================================
  //                     GRAPH DATA PREPARATION
  // ===========================================================================

  /**
   * 📖 Chart.js Data Structure
   * 
   * Prepare data for VerticalGraph component.
   * Format required by Chart.js:
   * {
   *   labels: ["TCS", "RELIANCE", ...],  // X-axis labels
   *   datasets: [{
   *     label: "Stock Price",
   *     data: [3250, 2850, ...],          // Bar heights
   *     backgroundColor: "rgba(...)"
   *   }]
   * }
   */
  const labels = allHoldings.map((stock) => stock.name);
  const data = {
    labels,
    datasets: [{
      label: "Stock Price",
      data: allHoldings.map((stock) => stock.price),
      backgroundColor: "rgba(255, 99, 132, 0.5)",
    }],
  };

  // ===========================================================================
  //                     RENDER - LOADING STATE
  // ===========================================================================

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  // ===========================================================================
  //                     RENDER - MAIN CONTENT
  // ===========================================================================

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {/* ================= PENDING ORDERS WARNING BANNER ================= */}
      {/* 
        📖 This banner appears when there are pending orders that need confirmation.
        This prevents the issue where holdings don't show because orders are pending.
      */}
      {pendingOrdersCount > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '4px' }}>
                {pendingOrdersCount} Pending Order{pendingOrdersCount > 1 ? 's' : ''} Need Confirmation!
              </strong>
              <span style={{ fontSize: '0.85rem', opacity: 0.95 }}>
                Your holdings may not show because {pendingOrdersCount > 1 ? 'these orders' : 'this order'} need{pendingOrdersCount === 1 ? 's' : ''} to be confirmed in the Orders tab.
              </span>
            </div>
          </div>
          <Link
            to="/orders"
            style={{
              background: 'white',
              color: '#ff9800',
              padding: '8px 16px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'transform 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            Go to Orders →
          </Link>
        </div>
      )}

      {/* ================= STATS BAR ================= */}
      {/* Shows total investment, current value, and P&L */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px',
        background: '#f8f9fa',
        padding: '12px 16px',
        borderRadius: '8px'
      }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
          Holdings ({allHoldings.length})
        </h3>
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Total Investment */}
          <div>
            <span style={{ color: '#666', fontSize: '0.75rem' }}>Investment: </span>
            <span style={{ fontWeight: 600 }}>
              ₹{totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
          {/* Current Value */}
          <div>
            <span style={{ color: '#666', fontSize: '0.75rem' }}>Current: </span>
            <span style={{ fontWeight: 600 }}>
              ₹{currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
          {/* Profit/Loss */}
          <div>
            <span style={{ color: '#666', fontSize: '0.75rem' }}>P&L: </span>
            <span style={{ 
              fontWeight: 700, 
              color: totalPnL >= 0 ? '#2e7d32' : '#c62828'  // Green if profit, red if loss
            }}>
              {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({pnlPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* ================= HOLDINGS TABLE ================= */}
      <div style={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: '8px', 
        overflow: 'hidden',
        marginBottom: '16px'
      }}>
        {allHoldings.length === 0 ? (
          // Empty state
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
            <p>No holdings yet. Place a BUY order to add holdings.</p>
          </div>
        ) : (
          // Holdings table
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            {/* Table Header */}
            <thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <tr>
                <th style={{ color: 'white', padding: '10px', textAlign: 'left' }}>Stock</th>
                <th style={{ color: 'white', padding: '10px', textAlign: 'center' }}>Qty</th>
                <th style={{ color: 'white', padding: '10px', textAlign: 'right' }}>Avg</th>
                <th style={{ color: 'white', padding: '10px', textAlign: 'right' }}>LTP</th>
                <th style={{ color: 'white', padding: '10px', textAlign: 'right' }}>Value</th>
                <th style={{ color: 'white', padding: '10px', textAlign: 'right' }}>P&L</th>
                <th style={{ color: 'white', padding: '10px', textAlign: 'center' }}>Trade</th>
              </tr>
            </thead>
            {/* Table Body */}
            <tbody>
              {allHoldings.map((stock, index) => {
                // Calculate P&L for this stock
                const curValue = stock.price * stock.qty;
                const investment = stock.avg * stock.qty;
                const pnl = curValue - investment;
                const pnlPct = ((pnl / investment) * 100).toFixed(1);
                const isProfit = pnl >= 0;

                return (
                  <tr 
                    key={index} 
                    style={{ 
                      borderBottom: '1px solid #eee', 
                      background: index % 2 === 0 ? '#fff' : '#fafafa'  // Alternating row colors
                    }}
                  >
                    {/* Stock Name */}
                    <td style={{ padding: '10px' }}>
                      <strong style={{ color: '#1a237e' }}>{stock.name}</strong>
                    </td>
                    {/* Quantity */}
                    <td style={{ padding: '10px', textAlign: 'center' }}>{stock.qty}</td>
                    {/* Average Price */}
                    <td style={{ padding: '10px', textAlign: 'right' }}>₹{stock.avg.toFixed(0)}</td>
                    {/* Last Traded Price (LTP) */}
                    <td style={{ padding: '10px', textAlign: 'right' }}>₹{stock.price.toFixed(0)}</td>
                    {/* Current Value */}
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      ₹{curValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    {/* Profit/Loss */}
                    <td style={{ 
                      padding: '10px', 
                      textAlign: 'right',
                      color: isProfit ? '#2e7d32' : '#c62828',  // Green/Red
                      fontWeight: 600
                    }}>
                      {isProfit ? '+' : ''}₹{pnl.toFixed(0)} ({pnlPct}%)
                    </td>
                    {/* Trade Buttons */}
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {/* Buy Button */}
                        <button
                          onClick={() => openTradeModal(stock, 'BUY')}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Buy
                        </button>
                        {/* Sell Button */}
                        <button
                          onClick={() => openTradeModal(stock, 'SELL')}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #f44336 0%, #c62828 100%)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Sell
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= PRICE CHART ================= */}
      {allHoldings.length > 0 && (
        <div style={{ 
          background: '#fff', 
          borderRadius: '8px', 
          border: '1px solid #e0e0e0',
          padding: '16px',
          height: '200px'
        }}>
          <VerticalGraph data={data} />
        </div>
      )}

      {/* ================= TRADE MODAL ================= */}
      {/* Modal for quick Buy/Sell from Holdings */}
      {tradeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',  // Dark overlay
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '360px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px',
              background: tradeModal.mode === 'BUY' 
                ? 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)'   // Green for Buy
                : 'linear-gradient(135deg, #f44336 0%, #c62828 100%)', // Red for Sell
              color: 'white'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                {tradeModal.mode} {tradeModal.stock.name}
              </h3>
              <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.85rem' }}>
                Current Holding: {tradeModal.stock.qty} shares @ ₹{tradeModal.stock.avg.toFixed(2)}
              </p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              {/* Quantity Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.85rem' }}>
                  Quantity {tradeModal.mode === 'SELL' && `(Max: ${tradeModal.stock.qty})`}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #e0e0e0', borderRadius: '8px' }}>
                  {/* Minus Button */}
                  <button
                    onClick={() => setTradeQty(Math.max(1, tradeQty - 1))}
                    style={{ 
                      padding: '10px 16px', 
                      border: 'none', 
                      background: '#f5f5f5',
                      cursor: 'pointer',
                      fontSize: '1.1rem'
                    }}
                  >−</button>
                  {/* Quantity Input */}
                  <input
                    type="number"
                    min="1"
                    max={tradeModal.mode === 'SELL' ? tradeModal.stock.qty : undefined}
                    value={tradeQty}
                    onChange={(e) => setTradeQty(parseInt(e.target.value) || 1)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: 'none',
                      textAlign: 'center',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                  {/* Plus Button */}
                  <button
                    onClick={() => {
                      const max = tradeModal.mode === 'SELL' ? tradeModal.stock.qty : 9999;
                      setTradeQty(Math.min(max, tradeQty + 1));
                    }}
                    style={{ 
                      padding: '10px 16px', 
                      border: 'none', 
                      background: '#f5f5f5',
                      cursor: 'pointer',
                      fontSize: '1.1rem'
                    }}
                  >+</button>
                </div>
                {/* Sell Quantity Warning */}
                {tradeModal.mode === 'SELL' && tradeQty > tradeModal.stock.qty && (
                  <p style={{ color: '#c62828', fontSize: '0.8rem', margin: '4px 0 0' }}>
                    ⚠️ Cannot exceed holding quantity
                  </p>
                )}
              </div>

              {/* Price Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.85rem' }}>
                  Price (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={tradePrice}
                  onChange={(e) => setTradePrice(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Order Summary */}
              <div style={{ 
                background: '#f8f9fa', 
                borderRadius: '8px', 
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#666' }}>Order Value</span>
                  <span style={{ fontWeight: 600 }}>
                    ₹{(tradeQty * tradePrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                {tradeModal.mode === 'SELL' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Remaining Shares</span>
                    <span style={{ fontWeight: 600 }}>{tradeModal.stock.qty - tradeQty}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {/* Execute Trade Button */}
                <button
                  onClick={executeTrade}
                  disabled={tradingLoading || (tradeModal.mode === 'SELL' && tradeQty > tradeModal.stock.qty)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: tradeModal.mode === 'BUY'
                      ? 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)'
                      : 'linear-gradient(135deg, #f44336 0%, #c62828 100%)',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: tradingLoading ? 'wait' : 'pointer',
                    opacity: tradingLoading || (tradeModal.mode === 'SELL' && tradeQty > tradeModal.stock.qty) ? 0.7 : 1
                  }}
                >
                  {tradingLoading ? 'Placing...' : `${tradeModal.mode} ${tradeQty} Shares`}
                </button>
                {/* Cancel Button */}
                <button
                  onClick={closeTradeModal}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    background: 'white',
                    color: '#666',
                    fontSize: '1rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Holdings;

/**
 * ===================================================================================
 *                           📌 SUMMARY & CHEAT SHEET
 * ===================================================================================
 * 
 * 🎯 WHAT THIS COMPONENT DOES:
 * ----------------------------
 * 1. Fetches holdings from MongoDB via backend API
 * 2. Calculates portfolio value and P&L
 * 3. Displays holdings in a table with trade buttons
 * 4. Shows a bar chart of stock prices
 * 5. Provides in-page modal for quick Buy/Sell
 * 
 * 🎯 DATA FLOW:
 * -------------
 * GET /allHoldings → MongoDB → React State → Table Rendering
 * POST /newOrder → MongoDB → Refresh → Updated Table
 * 
 * 🎯 KEY FORMULAS:
 * ----------------
 * - Investment = Σ (avg × qty)
 * - Current Value = Σ (price × qty)
 * - P&L = Current Value - Investment
 * - P&L % = (P&L / Investment) × 100
 * 
 * 🎯 VALIDATION:
 * --------------
 * - Can't sell more shares than owned
 * - Quantity must be > 0
 * 
 * 🎯 INTERVIEW QUESTIONS:
 * -----------------------
 * Q: "How do you handle real-time portfolio updates?"
 * A: "I use useEffect with setInterval to auto-refresh every 30 seconds.
 *    The cleanup function in useEffect clears the interval on unmount
 *    to prevent memory leaks."
 * 
 * Q: "How do you prevent users from selling more than they own?"
 * A: "Double validation - once in the frontend (before API call) and once
 *    in the backend (before database update). The UI also shows a warning
 *    when the quantity exceeds holdings."
 * 
 * Q: "How do you calculate P&L?"
 * A: "I use JavaScript's reduce() method to sum up all investments and
 *    current values. P&L is the difference between current value and
 *    total investment, expressed both as absolute value and percentage."
 * 
 * ===================================================================================
 */
