/**
 * ===================================================================================
 *                     DASHBOARD COMPONENT - Main App Layout 🏠
 * ===================================================================================
 * 
 * 📚 WHAT IS THIS COMPONENT?
 * --------------------------
 * Dashboard is the MAIN LAYOUT COMPONENT that structures the entire application.
 * It contains:
 * - Left sidebar: WatchList (stock tracker)
 * - Right content: Routes to different pages (Summary, Orders, Holdings, etc.)
 * 
 * 🔗 HOW IT FITS IN THE APP HIERARCHY:
 * ------------------------------------
 * 
 *     index.js (React entry point)
 *         │
 *         └── <BrowserRouter>
 *                 │
 *                 └── <Home />
 *                         │
 *                         └── <Dashboard />  ← THIS FILE!
 *                                 │
 *                                 ├── <WatchList />        (Left sidebar)
 *                                 │
 *                                 └── <Routes>             (Right content)
 *                                         │
 *                                         ├── /          → <Summary />
 *                                         ├── /orders    → <Orders />
 *                                         ├── /holdings  → <Holdings />
 *                                         ├── /positions → <Positions />
 *                                         ├── /funds     → <Funds />
 *                                         └── /apps      → <Apps /> (AI Copilot)
 * 
 * 📌 KEY FEATURES:
 * ----------------
 * 1. Two-column layout (WatchList + Content)
 * 2. React Router for page navigation
 * 3. GeneralContextProvider wraps WatchList for Buy/Sell modal
 * 
 * 📌 INTERVIEW KEY POINTS:
 * -----------------------
 * "The Dashboard component uses React Router for client-side routing.
 * I wrapped the WatchList in GeneralContextProvider so the Buy/Sell modal
 * can be triggered from any stock item. The layout uses CSS flexbox for
 * a responsive two-column design."
 * 
 * ===================================================================================
 *                           LAYOUT STRUCTURE
 * ===================================================================================
 * 
 *     ┌─────────────────────────────────────────────────────────────────┐
 *     │                        Dashboard                                 │
 *     ├───────────────┬─────────────────────────────────────────────────┤
 *     │               │                                                  │
 *     │   WatchList   │              Content Area                        │
 *     │   (sidebar)   │              (Routes)                            │
 *     │               │                                                  │
 *     │  ┌─────────┐  │    ┌────────────────────────────────────────┐   │
 *     │  │ Search  │  │    │                                        │   │
 *     │  ├─────────┤  │    │   Page content based on route:          │   │
 *     │  │ RELIANCE│  │    │   - Summary (/)                        │   │
 *     │  │ TCS     │  │    │   - Orders (/orders)                   │   │
 *     │  │ INFY    │  │    │   - Holdings (/holdings)               │   │
 *     │  │ HDFC    │  │    │   - Positions (/positions)             │   │
 *     │  │ ICICI   │  │    │   - Funds (/funds)                     │   │
 *     │  │ ...     │  │    │   - Apps (/apps) → AI Copilot          │   │
 *     │  └─────────┘  │    │                                        │   │
 *     │               │    └────────────────────────────────────────┘   │
 *     └───────────────┴─────────────────────────────────────────────────┘
 * 
 * ===================================================================================
 */

// =============================================================================
//                           IMPORTS SECTION
// =============================================================================

import React from "react";
/**
 * 📖 React Import
 * 
 * Required for JSX syntax and React component creation.
 */

import { Route, Routes } from "react-router-dom";
/**
 * 📖 React Router Imports
 * 
 * - Routes: Container for all Route components
 * - Route: Defines a mapping between URL path and component
 * 
 * 📌 PATTERN:
 *     <Routes>
 *       <Route path="/path" element={<Component />} />
 *     </Routes>
 * 
 * When URL matches "/path", Component is rendered.
 */

// ============= Page Components =============
import Apps from "./Apps";
/**
 * 📖 Apps Component
 * 
 * Contains the AI Copilot - voice commands, stock research, chat.
 * Route: /apps
 */

import Funds from "./Funds";
/**
 * 📖 Funds Component
 * 
 * Shows available balance, margins, and fund allocation.
 * Route: /funds
 */

import Holdings from "./Holdings";
/**
 * 📖 Holdings Component
 * 
 * Displays user's stock portfolio with P&L and trade buttons.
 * Route: /holdings
 */

import Orders from "./Orders";
/**
 * 📖 Orders Component
 * 
 * Shows all orders (pending, executed, rejected) with Human-in-Loop confirmation.
 * Route: /orders
 */

import Positions from "./Positions";
/**
 * 📖 Positions Component
 * 
 * Shows intraday trading positions.
 * Route: /positions
 */

import Summary from "./Summary";
/**
 * 📖 Summary Component
 * 
 * Dashboard home - overview of portfolio, market indices.
 * Route: / (root)
 */

import WatchList from "./WatchList";
/**
 * 📖 WatchList Component
 * 
 * Left sidebar showing tracked stocks with live prices.
 * Always visible, not controlled by routing.
 */

import { GeneralContextProvider } from "./GeneralContext";
/**
 * 📖 GeneralContextProvider
 * 
 * Provides global state for Buy/Sell modal.
 * Wraps WatchList so any stock item can trigger the modal.
 * 
 * 📌 WHY CONTEXT?
 * WatchList → WatchListItem → WatchListActions needs to open BuyActionWindow.
 * Context avoids passing props through every level (prop drilling).
 */

// =============================================================================
//                           DASHBOARD COMPONENT
// =============================================================================

/**
 * 📖 Dashboard Component
 * 
 * Main layout component that structures the app into two columns:
 * - Left: WatchList (stock tracker sidebar)
 * - Right: Content area (pages based on route)
 * 
 * 📌 CSS CLASS:
 * The "dashboard-container" class should define flexbox layout:
 *   .dashboard-container {
 *     display: flex;
 *     height: 100%;
 *   }
 */
const Dashboard = () => {
  return (
    <div className="dashboard-container">
      {/* ================= LEFT SIDEBAR: WATCHLIST ================= */}
      {/* 
        GeneralContextProvider wraps WatchList to provide:
        - openBuyWindow()
        - openSellWindow()
        - closeBuyWindow()
        
        This allows WatchListActions to trigger BuyActionWindow modal.
      */}
      <GeneralContextProvider>
        <WatchList />
      </GeneralContextProvider>
      
      {/* ================= RIGHT CONTENT: ROUTED PAGES ================= */}
      {/* 
        The "content" div contains all routed pages.
        React Router renders the matching component based on URL.
        
        📌 ROUTES:
        - /          → Summary (dashboard home)
        - /orders    → Orders list with HITL confirmation
        - /holdings  → Stock portfolio with trade buttons
        - /positions → Intraday positions
        - /funds     → Balance and margin info
        - /apps      → AI Copilot (voice, chat, research)
      */}
      <div className="content">
        <Routes>
          {/* 
            Home Route (exact path="/")
            The "exact" keyword ensures this only matches "/" and not "/orders" etc.
          */}
          <Route exact path="/" element={<Summary />} />
          
          {/* Orders Route */}
          <Route path="/orders" element={<Orders />} />
          
          {/* Holdings Route (Stock Portfolio) */}
          <Route path="/holdings" element={<Holdings />} />
          
          {/* Positions Route (Intraday Trading) */}
          <Route path="/positions" element={<Positions />} />
          
          {/* Funds Route (Balance & Margins) */}
          <Route path="/funds" element={<Funds />} />
          
          {/* Apps Route (AI Copilot) */}
          <Route path="/apps" element={<Apps />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;

/**
 * ===================================================================================
 *                           📌 SUMMARY & CHEAT SHEET
 * ===================================================================================
 * 
 * 🎯 WHAT THIS COMPONENT DOES:
 * ----------------------------
 * 1. Creates the main two-column layout
 * 2. Renders WatchList in left sidebar (always visible)
 * 3. Uses React Router to render pages in right content area
 * 4. Wraps WatchList in GeneralContextProvider for modal access
 * 
 * 🎯 ROUTE MAPPING:
 * -----------------
 * 
 * | URL         | Component   | Description                    |
 * |-------------|-------------|--------------------------------|
 * | /           | Summary     | Dashboard home, market overview|
 * | /orders     | Orders      | Order list with HITL           |
 * | /holdings   | Holdings    | Stock portfolio, P&L           |
 * | /positions  | Positions   | Intraday trading               |
 * | /funds      | Funds       | Balance, margins               |
 * | /apps       | Apps        | AI Copilot interface           |
 * 
 * 🎯 KEY PATTERNS:
 * ----------------
 * 1. React Router for SPA navigation
 * 2. Context Provider for global state
 * 3. Flexbox for two-column layout
 * 4. Component composition (Dashboard → WatchList + Content)
 * 
 * 🎯 INTERVIEW QUESTIONS:
 * -----------------------
 * Q: "How do you handle navigation in your app?"
 * A: "I use React Router (react-router-dom). The Dashboard component defines
 *    all routes using the Routes and Route components. When the URL changes,
 *    React Router renders the matching component without a full page reload."
 * 
 * Q: "Why is WatchList outside the Routes?"
 * A: "WatchList is always visible regardless of which page the user is on.
 *    It's part of the layout, not a routed page. The Routes only control
 *    the content area on the right side."
 * 
 * Q: "How does the Buy/Sell modal work from WatchList?"
 * A: "I wrap WatchList in GeneralContextProvider. This provides openBuyWindow()
 *    and openSellWindow() functions to all child components. WatchListActions
 *    uses useContext(GeneralContext) to access these functions and trigger
 *    the BuyActionWindow modal."
 * 
 * ===================================================================================
 */
