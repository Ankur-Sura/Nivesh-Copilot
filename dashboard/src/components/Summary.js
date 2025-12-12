import React, { useState, useEffect } from "react";
import axios from "axios";

const Summary = () => {
  const [holdings, setHoldings] = useState([]);
  const [funds, setFunds] = useState({
    totalFunds: 10000000, // 1 Crore
    usedMargin: 0,
  });

  useEffect(() => {
    // Fetch holdings
    axios.get("http://localhost:3002/allHoldings").then((res) => {
      setHoldings(res.data);
    }).catch(err => console.error("Error fetching holdings:", err));
  }, []);

  // Calculate holdings stats
  const totalInvestment = holdings.reduce((sum, stock) => sum + (stock.avg * stock.qty), 0);
  const currentValue = holdings.reduce((sum, stock) => sum + (stock.price * stock.qty), 0);
  const totalPnL = currentValue - totalInvestment;
  const pnlPercent = totalInvestment > 0 ? ((totalPnL / totalInvestment) * 100).toFixed(2) : 0;
  
  // Calculate available margin
  const availableMargin = funds.totalFunds - totalInvestment;

  const formatCurrency = (value) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(2)}k`;
    }
    return `₹${value.toFixed(2)}`;
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '4px 0' }}>
      {/* Welcome */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#333' }}>
          Hi, Ankur! 👋
        </h2>
        <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
          Welcome to your trading dashboard
        </p>
      </div>

      {/* Funds Card */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        color: 'white'
      }}>
        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Available Balance</p>
        <h2 style={{ margin: '8px 0', fontSize: '2rem', fontWeight: 700 }}>
          {formatCurrency(availableMargin)}
        </h2>
        <div style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>Total Funds</p>
            <p style={{ margin: '2px 0 0 0', fontWeight: 600 }}>{formatCurrency(funds.totalFunds)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>Invested</p>
            <p style={{ margin: '2px 0 0 0', fontWeight: 600 }}>{formatCurrency(totalInvestment)}</p>
          </div>
        </div>
      </div>

      {/* Holdings Summary Card */}
      <div style={{ 
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e0e0e0',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#333' }}>
            Holdings ({holdings.length})
          </h3>
          <span style={{ 
            background: totalPnL >= 0 ? '#e8f5e9' : '#ffebee',
            color: totalPnL >= 0 ? '#2e7d32' : '#c62828',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            {totalPnL >= 0 ? '📈' : '📉'} {totalPnL >= 0 ? '+' : ''}{pnlPercent}%
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>P&L</p>
            <h3 style={{ 
              margin: '4px 0 0 0', 
              fontSize: '1.3rem',
              color: totalPnL >= 0 ? '#2e7d32' : '#c62828',
              fontWeight: 700
            }}>
              {totalPnL >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalPnL))}
            </h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Current Value</p>
            <p style={{ margin: '4px 0 0 0', fontWeight: 600, fontSize: '1rem' }}>{formatCurrency(currentValue)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Investment</p>
            <p style={{ margin: '4px 0 0 0', fontWeight: 600, fontSize: '1rem' }}>{formatCurrency(totalInvestment)}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '12px' 
      }}>
        <div style={{ 
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>Total Stocks</p>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', color: '#333' }}>{holdings.length}</h3>
        </div>
        <div style={{ 
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>Day's P&L</p>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', color: '#2e7d32' }}>+₹0</h3>
        </div>
      </div>
    </div>
  );
};

export default Summary;
