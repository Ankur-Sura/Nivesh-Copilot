import React, { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import axios from "axios";

const Menu = () => {
  const [selectedMenu, setSelectedMenu] = useState(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  
  /**
   * 📖 Fetch Pending Orders Count
   * 
   * Checks for pending orders and shows a badge on the Orders menu item.
   * This helps users know when they need to confirm orders.
   */
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const res = await axios.get("http://localhost:3002/allOrders");
        const pending = res.data.filter(order => order.status === "pending");
        setPendingOrdersCount(pending.length);
      } catch (error) {
        console.error("Error fetching pending orders:", error);
      }
    };
    
    fetchPendingOrders();
    // Check every 30 seconds for new pending orders
    const interval = setInterval(fetchPendingOrders, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleMenuClick = (index) => {
    setSelectedMenu(index);
  };

  const handleProfileClick = (index) => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const menuClass = "menu";
  const activeMenuClass = "menu selected";

  return (
    <div className="menu-container">
      <img src="logo.png" style={{ width: "50px" }} />
      <div className="menus">
        <ul>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/"
              onClick={() => handleMenuClick(0)}
            >
              <p className={selectedMenu === 0 ? activeMenuClass : menuClass}>
                Dashboard
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none", position: "relative" }}
              to="/orders"
              onClick={() => handleMenuClick(1)}
            >
              <p className={selectedMenu === 1 ? activeMenuClass : menuClass}>
                Orders
                {/* Pending Orders Badge */}
                {pendingOrdersCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-8px",
                      background: "#ff9800",
                      color: "white",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      fontWeight: "bold",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                  >
                    {pendingOrdersCount > 9 ? "9+" : pendingOrdersCount}
                  </span>
                )}
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/holdings"
              onClick={() => handleMenuClick(2)}
            >
              <p className={selectedMenu === 2 ? activeMenuClass : menuClass}>
                Holdings
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/positions"
              onClick={() => handleMenuClick(3)}
            >
              <p className={selectedMenu === 3 ? activeMenuClass : menuClass}>
                Positions
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="funds"
              onClick={() => handleMenuClick(4)}
            >
              <p className={selectedMenu === 4 ? activeMenuClass : menuClass}>
                Funds
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/apps"
              onClick={() => handleMenuClick(6)}
            >
              <p className={selectedMenu === 6 ? activeMenuClass : menuClass}>
                Apps
              </p>
            </Link>
          </li>
        </ul>
        <hr />
        <div className="profile" onClick={handleProfileClick}>
          <div className="avatar">A</div>
          <p className="username">Ankur</p>
        </div>
      </div>
    </div>
  );
};

export default Menu;
