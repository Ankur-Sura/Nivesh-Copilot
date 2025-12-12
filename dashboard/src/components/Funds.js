import React, { useState, useEffect } from "react";
import axios from "axios";

const Funds = () => {
  const [holdings, setHoldings] = useState([]);
  const totalFunds = 10000000; // ₹1 Crore

  useEffect(() => {
    axios.get("http://localhost:3002/allHoldings")
      .then((res) => setHoldings(res.data))
      .catch((err) => console.error("Error:", err));
  }, []);

  // Calculate values
  const totalInvested = holdings.reduce((sum, stock) => sum + (stock.avg * stock.qty), 0);
  const currentValue = holdings.reduce((sum, stock) => sum + (stock.price * stock.qty), 0);
  const availableMargin = totalFunds - totalInvested;
  const unrealizedPnL = currentValue - totalInvested;

  const formatCurrency = (value) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        background: '#f8f9fa',
        padding: '12px 16px',
        borderRadius: '8px'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Funds & Margin</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            + Add Funds
          </button>
          <button style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Withdraw
          </button>
        </div>
      </div>

      {/* Main Balance Card */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        color: 'white'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Total Account Value</p>
        <h1 style={{ margin: '8px 0', fontSize: '2.5rem', fontWeight: 700 }}>
          {formatCurrency(totalFunds + unrealizedPnL)}
        </h1>
        <div style={{ display: 'flex', gap: '40px', marginTop: '16px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Available Margin</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.2rem', fontWeight: 600 }}>{formatCurrency(availableMargin)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Invested</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.2rem', fontWeight: 600 }}>{formatCurrency(totalInvested)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Unrealized P&L</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.2rem', fontWeight: 600, color: unrealizedPnL >= 0 ? '#90EE90' : '#ff6b6b' }}>
              {unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(unrealizedPnL)}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Equity Details */}
        <div style={{ 
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600, color: '#333' }}>
            Equity
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>Available Margin</span>
              <span style={{ fontWeight: 600, color: '#4184f3', fontSize: '1rem' }}>{formatCurrency(availableMargin)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>Used Margin</span>
              <span style={{ fontWeight: 500 }}>{formatCurrency(totalInvested)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>Available Cash</span>
              <span style={{ fontWeight: 500 }}>{formatCurrency(availableMargin)}</span>
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '4px 0' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>Opening Balance</span>
              <span style={{ fontWeight: 500 }}>{formatCurrency(totalFunds)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>Payin</span>
              <span style={{ fontWeight: 500 }}>₹0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>SPAN</span>
              <span style={{ fontWeight: 500 }}>₹0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>Delivery Margin</span>
              <span style={{ fontWeight: 500 }}>{formatCurrency(totalInvested)}</span>
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '4px 0' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>Holdings Value</span>
              <span style={{ fontWeight: 600, color: '#2e7d32' }}>{formatCurrency(currentValue)}</span>
            </div>
          </div>
        </div>

        {/* Commodity Section */}
        <div style={{ 
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600, color: '#333' }}>
            Commodity
          </h3>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '40px 20px',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <p style={{ color: '#888', margin: '0 0 16px 0', fontSize: '0.9rem' }}>
              You don't have a commodity account
            </p>
            <button style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              Open Account
            </button>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div style={{ 
        marginTop: '20px',
        padding: '16px',
        background: '#e8f5e9',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '1.5rem' }}>💰</span>
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: '#2e7d32' }}>You have ₹1 Crore in your account!</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#666' }}>
            Use the AI Copilot to analyze stocks and place orders with voice commands.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Funds;
