import React, { useState, useEffect } from "react";
import axios from "axios";

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:3002/allPositions")
      .then((res) => {
        setPositions(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching positions:", err);
        setLoading(false);
      });
  }, []);

  // Calculate totals
  const totalPnL = positions.reduce((sum, stock) => {
    const pnl = (stock.price * stock.qty) - (stock.avg * stock.qty);
    return sum + pnl;
  }, 0);

  const formatCurrency = (value) => {
    return `₹${Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <p>Loading positions...</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        background: '#f8f9fa',
        padding: '12px 16px',
        borderRadius: '8px'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
          Positions ({positions.length})
        </h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#666', fontSize: '0.8rem' }}>Day's P&L: </span>
            <span style={{ 
              fontWeight: 700, 
              color: totalPnL >= 0 ? '#2e7d32' : '#c62828' 
            }}>
              {totalPnL >= 0 ? '+' : '-'}{formatCurrency(totalPnL)}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: '8px', 
        overflow: 'hidden'
      }}>
        {positions.length === 0 ? (
          <div style={{ 
            padding: '60px', 
            textAlign: 'center', 
            color: '#888',
            background: '#fafafa'
          }}>
            <p style={{ fontSize: '1.1rem', margin: '0 0 8px 0' }}>No open positions</p>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>Your intraday positions will appear here</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <tr>
                <th style={{ color: 'white', padding: '12px 10px', textAlign: 'left', fontWeight: 500 }}>Product</th>
                <th style={{ color: 'white', padding: '12px 10px', textAlign: 'left', fontWeight: 500 }}>Instrument</th>
                <th style={{ color: 'white', padding: '12px 10px', textAlign: 'center', fontWeight: 500 }}>Qty</th>
                <th style={{ color: 'white', padding: '12px 10px', textAlign: 'right', fontWeight: 500 }}>Avg</th>
                <th style={{ color: 'white', padding: '12px 10px', textAlign: 'right', fontWeight: 500 }}>LTP</th>
                <th style={{ color: 'white', padding: '12px 10px', textAlign: 'right', fontWeight: 500 }}>P&L</th>
                <th style={{ color: 'white', padding: '12px 10px', textAlign: 'right', fontWeight: 500 }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((stock, index) => {
                const curValue = stock.price * stock.qty;
                const pnl = curValue - stock.avg * stock.qty;
                const isProfit = pnl >= 0;

                return (
                  <tr key={index} style={{ 
                    borderBottom: '1px solid #e0e0e0',
                    background: index % 2 === 0 ? '#fff' : '#fafafa'
                  }}>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        background: '#e3f2fd',
                        color: '#1565c0'
                      }}>
                        {stock.product}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <strong style={{ color: '#1a237e' }}>{stock.name}</strong>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 500 }}>
                      {stock.qty}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      ₹{stock.avg.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      ₹{stock.price.toFixed(2)}
                    </td>
                    <td style={{ 
                      padding: '12px 10px', 
                      textAlign: 'right',
                      fontWeight: 600,
                      color: isProfit ? '#2e7d32' : '#c62828'
                    }}>
                      {isProfit ? '+' : ''}{pnl.toFixed(2)}
                    </td>
                    <td style={{ 
                      padding: '12px 10px', 
                      textAlign: 'right',
                      color: stock.isLoss ? '#c62828' : '#2e7d32',
                      fontWeight: 500
                    }}>
                      {stock.day}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Positions;
