import React, { useState, useEffect } from "react";
import axios from "axios";
import Menu from "./Menu";

const TopBar = () => {
  const [indices, setIndices] = useState({
    nifty: { price: null, change: 0 },
    sensex: { price: null, change: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const response = await axios.get("http://localhost:3002/api/market-indices");
        setIndices({
          nifty: response.data.nifty || { price: null, change: 0 },
          sensex: response.data.sensex || { price: null, change: 0 }
        });
      } catch (error) {
        console.error("Failed to fetch market indices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIndices();
  }, []);

  const formatPrice = (price) => {
    if (!price) return "---";
    return price.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  const formatChange = (change) => {
    if (!change) return "";
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <div className="topbar-container">
      <div className="indices-container">
        <div className="nifty">
          <p className="index">NIFTY 50</p>
          <p className={`index-points ${indices.nifty.change >= 0 ? 'up' : 'down'}`}>
            {loading ? "..." : formatPrice(indices.nifty.price)}
          </p>
          <p className={`percent ${indices.nifty.change >= 0 ? 'up' : 'down'}`}>
            {!loading && formatChange(indices.nifty.change)}
          </p>
        </div>
        <div className="sensex">
          <p className="index">SENSEX</p>
          <p className={`index-points ${indices.sensex.change >= 0 ? 'up' : 'down'}`}>
            {loading ? "..." : formatPrice(indices.sensex.price)}
          </p>
          <p className={`percent ${indices.sensex.change >= 0 ? 'up' : 'down'}`}>
            {!loading && formatChange(indices.sensex.change)}
          </p>
        </div>
      </div>

      <Menu />
    </div>
  );
};

export default TopBar;
