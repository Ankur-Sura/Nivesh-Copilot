/**
 * ===================================================================================
 *                     ORDERS COMPONENT - Order Management Table 📋
 * ===================================================================================
 * 
 * 📚 WHAT IS THIS COMPONENT?
 * --------------------------
 * Displays all orders (buy/sell) in a table format.
 * Shows:
 * - Order details (stock, quantity, price, total)
 * - Source (Voice 🎤, AI 🤖, Manual 📝)
 * - Status (Pending ⏳, Executed ✅, Rejected ❌)
 * - Action buttons (Confirm/Reject for pending orders)
 * 
 * 🔗 HUMAN-IN-THE-LOOP IMPLEMENTATION:
 * ------------------------------------
 * This component is where users CONFIRM or REJECT AI/Voice orders.
 * 
 * FLOW:
 * 1. AI/Voice order created → status="pending"
 * 2. Order appears in this table with "Confirm" and "Reject" buttons
 * 3. User clicks "Confirm" → POST /order/:id/confirm → Holdings updated
 * 4. User clicks "Reject" → POST /order/:id/reject → Order cancelled
 * 
 * 📌 KEY FEATURES:
 * ----------------
 * - Auto-refresh every 30 seconds
 * - Color-coded status badges
 * - Source badges (Voice/AI/Manual)
 * - Pending order count in header
 * - Real-time confirmation/rejection
 * 
 * ===================================================================================
 */

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

/**
 * 📖 Orders Component
 * 
 * Displays all orders from MongoDB in a table
 * Handles confirmation/rejection of pending AI/Voice orders
 */
const Orders = () => {
  // ===========================================================================
  //                     STATE MANAGEMENT
  // ===========================================================================
  
  const [orders, setOrders] = useState([]);
  /**
   * 📖 Array of order objects from MongoDB
   * 
   * Order structure:
   * {
   *   _id: "mongodb_id",
   *   name: "TCS",
   *   qty: 10,
   *   price: 3258.50,
   *   mode: "buy" | "sell",
   *   is_voice_order: true | false,
   *   is_simulated: true | false,
   *   status: "pending" | "executed" | "rejected",
   *   createdAt: "2024-01-01T12:00:00Z"
   * }
   */

  const [loading, setLoading] = useState(true);
  /**
   * 📖 Loading state while fetching orders
   */

  const [error, setError] = useState(null);
  /**
   * 📖 Error message if fetch fails
   */

  const [confirming, setConfirming] = useState(null);
  /**
   * 📖 Track which order is being confirmed/rejected
   * Prevents double-clicks during API call
   */

  const [missingHoldings, setMissingHoldings] = useState([]);
  /**
   * 📖 Track executed BUY orders that don't have corresponding holdings
   * Used to show warning and repair button
   */


  // ===========================================================================
  //                     FETCH ORDERS FROM BACKEND
  // ===========================================================================
  
  /**
   * 📖 Fetch Orders from Backend
   * 
   * 🔗 API FLOW:
   * Frontend → GET /allOrders (Backend)
   *      → MongoDB OrdersModel.find()
   *      → Returns array of orders sorted by newest first
   * 
   * Backend (index.js):
   *   app.get("/allOrders", async (req, res) => {
   *     let allOrders = await OrdersModel.find({}).sort({ createdAt: -1 });
   *     res.json(allOrders);
   *   });
   */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3002/allOrders");
      setOrders(response.data);
      setError(null);
      
      // Check for missing holdings
      await checkMissingHoldings(response.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 📖 Check for Missing Holdings
   * 
   * Compares executed BUY orders with actual holdings.
   * If an executed order doesn't have a corresponding holding, it's missing.
   * 
   * This is a safeguard to detect the issue where holdings weren't created.
   */
  const checkMissingHoldings = async (ordersList) => {
    try {
      // Get all executed BUY orders
      const executedBuyOrders = ordersList.filter(
        order => order.status === "executed" && order.mode?.toLowerCase() === "buy"
      );
      
      if (executedBuyOrders.length === 0) {
        setMissingHoldings([]);
        return;
      }
      
      // Get all holdings
      const holdingsResponse = await axios.get("http://localhost:3002/allHoldings");
      const holdings = holdingsResponse.data;
      const holdingNames = new Set(holdings.map(h => h.name.toUpperCase()));
      
      // Find orders without holdings
      const missing = executedBuyOrders.filter(
        order => !holdingNames.has(order.name.toUpperCase())
      );
      
      setMissingHoldings(missing);
      
      if (missing.length > 0) {
        console.warn(`⚠️ Found ${missing.length} executed orders without holdings:`, missing);
      }
    } catch (error) {
      console.error("Error checking missing holdings:", error);
    }
  };

  /**
   * 📖 Repair Missing Holdings
   * 
   * Calls the backend repair endpoint to create missing holdings
   * from executed orders.
   */
  const repairHoldings = async () => {
    try {
      const response = await axios.get("http://localhost:3002/repair-holdings");
      
      if (response.data.fixed > 0) {
        alert(`✅ Fixed ${response.data.fixed} missing holdings!`);
        // Refresh orders and holdings
        await fetchOrders();
        // Trigger holdings refresh (if on Holdings page)
        window.dispatchEvent(new Event('holdings-refresh'));
      } else {
        alert("✅ All holdings are up to date!");
      }
      
      setMissingHoldings([]);
    } catch (error) {
      console.error("Error repairing holdings:", error);
      alert("❌ Failed to repair holdings. Please check console.");
    }
  };


  // ===========================================================================
  //                     AUTO-REFRESH ORDERS
  // ===========================================================================
  
  /**
   * 📖 useEffect - Fetch orders on mount and auto-refresh
   * 
   * Runs:
   * - Once when component mounts
   * - Every 30 seconds (auto-refresh)
   * 
   * Cleanup:
   * - Clears interval when component unmounts
   * - Prevents memory leaks
   */
  useEffect(() => {
    fetchOrders();
    
    // Refresh orders every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    /**
     * 📖 setInterval
     * Runs fetchOrders() every 30,000ms (30 seconds)
     * Keeps orders table up-to-date
     */
    
    return () => clearInterval(interval);
    /**
     * 📖 Cleanup function
     * Clears interval when component unmounts
     * Prevents interval from running after component is removed
     */
  }, []);

  // ===========================================================================
  //                     ORDER CONFIRMATION (HUMAN-IN-THE-LOOP)
  // ===========================================================================
  
  /**
   * 📖 Confirm Pending Order
   * 
   * 🔗 HUMAN-IN-THE-LOOP FLOW:
   * 1. User sees pending order in table
   * 2. User clicks "✓ Confirm" button
   * 3. POST /order/:id/confirm
   * 4. Backend updates holdings (calls updateHoldings function)
   * 5. Backend sets status="executed"
   * 6. Frontend refreshes orders table
   * 
   * Backend (index.js):
   *   app.post("/order/:id/confirm", async (req, res) => {
   *     // Update holdings
   *     await updateHoldings(order.name, order.qty, order.price, order.mode);
   *     // Set status to executed
   *     order.status = "executed";
   *     await order.save();
   *   });
   * 
   * 📌 This is the FINAL step in Human-in-the-Loop!
   * Order was created with status="pending", now user confirms it.
   */
  const confirmOrder = async (orderId) => {
    try {
      setConfirming(orderId);  // Show loading state for this order
      await axios.post(`http://localhost:3002/order/${orderId}/confirm`);
      await fetchOrders();  // Refresh to show updated status
      // Re-check for missing holdings after confirmation
      if (orders.length > 0) {
        await checkMissingHoldings(orders);
      }
      // Trigger holdings refresh (if on Holdings page)
      window.dispatchEvent(new Event('holdings-refresh'));
    } catch (err) {
      console.error("Error confirming order:", err);
      alert("Failed to confirm order");
    } finally {
      setConfirming(null);
    }
  };

  /**
   * 📖 Reject Pending Order
   * 
   * User decides NOT to execute the AI/Voice order
   * Holdings are NOT updated
   * Order status changes to "rejected"
   */
  const rejectOrder = async (orderId) => {
    try {
      setConfirming(orderId);
      await axios.post(`http://localhost:3002/order/${orderId}/reject`);
      fetchOrders();  // Refresh to show rejected status
    } catch (err) {
      console.error("Error rejecting order:", err);
      alert("Failed to reject order");
    } finally {
      setConfirming(null);
    }
  };

  // ===========================================================================
  //                     FORMATTING FUNCTIONS
  // ===========================================================================
  
  /**
   * 📖 Format Date for Display
   * 
   * Converts ISO date string to readable format
   * Example: "2024-01-01T12:30:00Z" → "01 Jan, 12:30 PM"
   */
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * 📖 Format Price for Display
   * 
   * Converts number to Indian currency format
   * Example: 3258.50 → "₹3,258.50"
   */
  const formatPrice = (price) => {
    if (!price && price !== 0) return "-";
    return `₹${parseFloat(price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  };

  // ===========================================================================
  //                     HELPER FUNCTIONS
  // ===========================================================================
  
  /**
   * 📖 Get Source Information
   * 
   * Determines order source and returns icon/label
   * 
   * Sources:
   * - 🎤 Voice: is_voice_order = true (from voice command)
   * - 🤖 AI: is_simulated = true (from AI Copilot)
   * - 📝 Manual: Neither flag set (from BuyActionWindow)
   */
  const getSourceInfo = (order) => {
    if (order.is_voice_order) {
      return { icon: "🎤", label: "Voice", class: "voice", title: "Voice Command" };
    } else if (order.is_simulated) {
      return { icon: "🤖", label: "AI", class: "simulated", title: "AI Copilot" };
    } else {
      return { icon: "📝", label: "Manual", class: "manual", title: "Manual Order" };
    }
  };

  /**
   * 📖 Get Status Display
   * 
   * Returns formatted status badge with color coding
   * 
   * Statuses:
   * - ⏳ Pending: Orange background (waiting for confirmation)
   * - ✅ Executed: Green background (confirmed and holdings updated)
   * - ❌ Rejected: Red background (user rejected the order)
   */
  const getStatusDisplay = (order) => {
    const status = order.status || "executed";
    
    if (status === "pending") {
      return {
        label: "⏳ Pending",
        style: { background: '#fff3e0', color: '#e65100', border: '1px solid #ffcc80' }
      };
    } else if (status === "executed") {
      return {
        label: "✅ Executed",
        style: { background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' }
      };
    } else if (status === "rejected") {
      return {
        label: "❌ Rejected",
        style: { background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a' }
      };
    }
    return { label: status, style: {} };
  };

  // ===========================================================================
  //                     CALCULATIONS
  // ===========================================================================
  
  /**
   * 📖 Count Pending Orders
   * 
   * Used to show "X pending" badge in header
   * Helps user see how many orders need attention
   */
  const pendingCount = orders.filter(o => o.status === "pending").length;

  // ===========================================================================
  //                     LOADING & ERROR STATES
  // ===========================================================================
  
  if (loading && orders.length === 0) {
    return (
      <div className="orders">
        <div className="orders-loading">
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="orders">
        <div className="orders-error">
          <p>⚠️ {error}</p>
          <button className="btn" onClick={fetchOrders}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders">
        <div className="no-orders">
          <p>You haven't placed any orders yet</p>
          <Link to={"/"} className="btn">
            Get started
          </Link>
        </div>
      </div>
    );
  }

  // ===========================================================================
  //                     RENDER ORDERS TABLE
  // ===========================================================================
  
  return (
    <div className="orders">
      {/* ===== HEADER ===== */}
      <div className="orders-header">
        <h3 className="title">
          Orders ({orders.length})
          {/* Show pending count if any */}
          {pendingCount > 0 && (
            <span style={{
              marginLeft: '10px',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              background: '#fff3e0',
              color: '#e65100',
              fontWeight: 500
            }}>
              {pendingCount} pending
            </span>
          )}
        </h3>
        <button className="refresh-btn" onClick={fetchOrders} title="Refresh Orders">
          🔄 Refresh
        </button>
      </div>

      {/* ===== MISSING HOLDINGS WARNING ===== */}
      {missingHoldings.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #f44336 0%, #c62828 100%)',
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
                {missingHoldings.length} Executed Order{missingHoldings.length > 1 ? 's' : ''} Missing Holdings!
              </strong>
              <span style={{ fontSize: '0.85rem', opacity: 0.95 }}>
                Some executed BUY orders don't have corresponding holdings. Click "Repair Holdings" to fix this.
              </span>
            </div>
          </div>
          <button
            onClick={repairHoldings}
            style={{
              background: 'white',
              color: '#f44336',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            🔧 Repair Holdings
          </button>
        </div>
      )}
      
      {/* ===== ORDERS TABLE ===== */}
      <div className="orders-table-container">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <tr>
              <th style={{ color: 'white', padding: '12px 10px', textAlign: 'left', fontWeight: 500 }}>Stock</th>
              <th style={{ color: 'white', padding: '12px 10px', textAlign: 'center', fontWeight: 500 }}>Type</th>
              <th style={{ color: 'white', padding: '12px 10px', textAlign: 'center', fontWeight: 500 }}>Qty</th>
              <th style={{ color: 'white', padding: '12px 10px', textAlign: 'right', fontWeight: 500 }}>Price</th>
              <th style={{ color: 'white', padding: '12px 10px', textAlign: 'right', fontWeight: 500 }}>Total</th>
              <th style={{ color: 'white', padding: '12px 10px', textAlign: 'center', fontWeight: 500 }}>Source</th>
              <th style={{ color: 'white', padding: '12px 10px', textAlign: 'center', fontWeight: 500 }}>Status</th>
              <th style={{ color: 'white', padding: '12px 10px', textAlign: 'center', fontWeight: 500 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => {
              const sourceInfo = getSourceInfo(order);
              const statusDisplay = getStatusDisplay(order);
              const isBuy = order.mode?.toLowerCase() === 'buy';
              const isPending = order.status === "pending";
              const isProcessing = confirming === order._id;
              
              return (
                <tr key={order._id || idx} style={{ 
                  borderBottom: '1px solid #e0e0e0',
                  /**
                   * 📖 Conditional Styling
                   * - Pending orders: Yellow background (#fffde7)
                   * - Other orders: Alternating white/grey (zebra striping)
                   */
                  background: isPending ? '#fffde7' : (idx % 2 === 0 ? '#fff' : '#fafafa')
                }}>
                  {/* Stock Name */}
                  <td style={{ padding: '12px 10px', textAlign: 'left' }}>
                    <strong style={{ color: '#1a237e' }}>{order.name || "-"}</strong>
                  </td>
                  
                  {/* Type (BUY/SELL) */}
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 16px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      background: isBuy ? '#e8f5e9' : '#ffebee',  // Green for BUY, Red for SELL
                      color: isBuy ? '#2e7d32' : '#c62828',
                      border: isBuy ? '1px solid #a5d6a7' : '1px solid #ef9a9a'
                    }}>
                      {order.mode?.toUpperCase() || "-"}
                    </span>
                  </td>
                  
                  {/* Quantity */}
                  <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 500 }}>{order.qty || "-"}</td>
                  
                  {/* Price per Share */}
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>{formatPrice(order.price)}</td>
                  
                  {/* Total Value */}
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 500 }}>
                    {order.price && order.qty ? formatPrice(order.price * order.qty) : "-"}
                    {/* Total = price × quantity */}
                  </td>
                  
                  {/* Source Badge */}
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      background: sourceInfo.class === 'voice' ? '#fce4ec' : 
                                  sourceInfo.class === 'simulated' ? '#e8eaf6' : '#f5f5f5',
                      color: sourceInfo.class === 'voice' ? '#c2185b' : 
                             sourceInfo.class === 'simulated' ? '#3f51b5' : '#666'
                    }} title={sourceInfo.title}>
                      {sourceInfo.icon} {sourceInfo.label}
                    </span>
                  </td>
                  
                  {/* Status Badge */}
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      ...statusDisplay.style
                    }}>
                      {statusDisplay.label}
                    </span>
                  </td>
                  
                  {/* Action Column */}
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    {isPending ? (
                      /**
                       * 📖 HUMAN-IN-THE-LOOP: Confirm/Reject Buttons
                       * 
                       * Only shown for pending orders (AI/Voice orders)
                       * Manual orders are executed immediately, so no buttons needed
                       */
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {/* Confirm Button */}
                        <button
                          onClick={() => confirmOrder(order._id)}
                          disabled={isProcessing}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: isProcessing ? 'wait' : 'pointer',
                            opacity: isProcessing ? 0.7 : 1
                          }}
                        >
                          {isProcessing ? '...' : '✓ Confirm'}
                        </button>
                        
                        {/* Reject Button */}
                        <button
                          onClick={() => rejectOrder(order._id)}
                          disabled={isProcessing}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid #ef5350',
                            background: 'white',
                            color: '#c62828',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: isProcessing ? 'wait' : 'pointer',
                            opacity: isProcessing ? 0.7 : 1
                          }}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    ) : (
                      // For executed/rejected orders, show timestamp
                      <span style={{ color: '#999', fontSize: '0.8rem' }}>
                        {formatDate(order.createdAt)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ===== FOOTER DISCLAIMER ===== */}
      <div className="orders-footer">
        <p className="orders-disclaimer">
          ⚠️ Voice (🎤) and AI (🤖) orders require confirmation before execution. Manual orders are placed directly.
        </p>
      </div>
    </div>
  );
};

export default Orders;

/**
 * ===================================================================================
 *                     SUMMARY: HUMAN-IN-THE-LOOP FLOW
 * ===================================================================================
 * 
 * 🔗 COMPLETE FLOW:
 * 
 * 1. User places order via Voice or AI Copilot
 *    ↓
 * 2. Order created with status="pending"
 *    ↓
 * 3. Order appears in this table with yellow background
 *    ↓
 * 4. User sees "✓ Confirm" and "✗ Reject" buttons
 *    ↓
 * 5. User clicks "Confirm"
 *    ↓
 * 6. POST /order/:id/confirm
 *    ↓
 * 7. Backend updates holdings (updateHoldings function)
 *    Backend sets status="executed"
 *    ↓
 * 8. Table refreshes, order shows green "✅ Executed" badge
 *    Holdings updated in Holdings page
 * 
 * 📌 KEY CONCEPTS:
 * 
 * - Pending Orders: AI/Voice orders waiting for user confirmation
 * - Executed Orders: Confirmed orders, holdings updated
 * - Rejected Orders: User cancelled the order, holdings NOT updated
 * - Auto-refresh: Table updates every 30 seconds
 * - Source Tracking: Shows if order came from Voice, AI, or Manual
 * 
 * 📌 INTERVIEW: "Explain the Human-in-the-Loop for orders"
 * 
 * "When a user places an order through voice or AI, it's created with status='pending'
 * instead of executing immediately. The order appears in the Orders table with
 * 'Confirm' and 'Reject' buttons. Only when the user explicitly clicks 'Confirm'
 * does the backend update holdings. This two-step process prevents accidental
 * trades, especially with voice commands where transcription might be incorrect."
 * 
 * ===================================================================================
 */
