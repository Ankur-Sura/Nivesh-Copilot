/**
 * ===================================================================================
 *                     INDEX.JS - React Application Entry Point 🚀
 * ===================================================================================
 * 
 * 📚 WHAT IS THIS FILE?
 * ---------------------
 * This is the ENTRY POINT of the React application.
 * It's where React connects to the HTML DOM and starts rendering.
 * 
 * 🔗 HOW THE APP STARTS:
 * ----------------------
 * 
 *     1. User opens http://localhost:3000
 *           │
 *           ▼
 *     2. Browser loads public/index.html
 *        (which has <div id="root"></div>)
 *           │
 *           ▼
 *     3. This file (index.js) runs:
 *        - Finds the <div id="root"> element
 *        - Creates a React root
 *        - Renders <Home /> component inside it
 *           │
 *           ▼
 *     4. Home → Dashboard → WatchList + Pages
 * 
 * 📌 KEY CONCEPTS:
 * ----------------
 * 1. ReactDOM.createRoot() - New React 18 API for rendering
 * 2. BrowserRouter - Enables React Router for SPA navigation
 * 3. React.StrictMode - Development helper for detecting issues
 * 
 * 📌 INTERVIEW KEY POINTS:
 * -----------------------
 * "The index.js file is the entry point where React mounts to the DOM.
 * I use BrowserRouter from react-router-dom to enable client-side routing,
 * which allows navigation without full page reloads."
 * 
 * ===================================================================================
 *                           APP STARTUP FLOW
 * ===================================================================================
 * 
 *     public/index.html
 *         │
 *         │  Contains: <div id="root"></div>
 *         │
 *         ▼
 *     src/index.js (This file)
 *         │
 *         │  ReactDOM.createRoot(document.getElementById("root"))
 *         │  root.render(<App />)
 *         │
 *         ▼
 *     src/components/Home.js
 *         │
 *         │  Contains: TopBar + Menu + Dashboard
 *         │
 *         ▼
 *     src/components/Dashboard.js
 *         │
 *         │  Contains: WatchList + Routes (Summary, Orders, Holdings...)
 *         │
 *         ▼
 *     User sees the application!
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
 * Required for JSX syntax. Even though we don't explicitly use "React" in JSX,
 * older versions required it. React 17+ doesn't require it for JSX, but we
 * still need it for React.StrictMode.
 */

import ReactDOM from "react-dom/client";
/**
 * 📖 ReactDOM Import (React 18+)
 * 
 * ReactDOM is the package that connects React to the browser DOM.
 * 
 * In React 18, we use "react-dom/client" instead of just "react-dom".
 * The new API uses createRoot() instead of the old render().
 * 
 * 📌 OLD WAY (React 17 and earlier):
 *     import ReactDOM from "react-dom";
 *     ReactDOM.render(<App />, document.getElementById("root"));
 * 
 * 📌 NEW WAY (React 18+):
 *     import ReactDOM from "react-dom/client";
 *     const root = ReactDOM.createRoot(document.getElementById("root"));
 *     root.render(<App />);
 * 
 * 📌 WHY THE CHANGE?
 * React 18 introduced Concurrent Features. The new API supports:
 * - Automatic batching of updates
 * - Transitions
 * - Suspense improvements
 */

import { BrowserRouter, Route, Routes } from "react-router-dom";
/**
 * 📖 React Router Imports
 * 
 * - BrowserRouter: Wraps the app to enable routing. Uses browser history API.
 * - Routes: Container for Route components
 * - Route: Maps a URL path to a component
 * 
 * 📌 BrowserRouter vs HashRouter:
 * - BrowserRouter: Uses clean URLs (/orders, /holdings)
 * - HashRouter: Uses hash URLs (/#/orders, /#/holdings)
 * 
 * We use BrowserRouter for cleaner URLs.
 */

import "./index.css";
/**
 * 📖 Global CSS Import
 * 
 * This imports the main stylesheet that applies to the entire app.
 * Contains:
 * - CSS variables for colors
 * - Reset styles
 * - Layout styles for dashboard-container, content, etc.
 * - WatchList styles
 * - Action button styles (Buy/Sell)
 */

import Home from "./components/Home";
/**
 * 📖 Home Component Import
 * 
 * The main wrapper component that contains:
 * - TopBar (header with logo, user info)
 * - Menu (navigation tabs)
 * - Dashboard (WatchList + content area)
 */

// =============================================================================
//                           APP RENDERING
// =============================================================================

/**
 * 📖 Step 1: Find the root DOM element
 * 
 * document.getElementById("root") finds:
 *     <div id="root"></div> 
 * 
 * This is in public/index.html. All React content renders inside this div.
 */
const root = ReactDOM.createRoot(document.getElementById("root"));

/**
 * 📖 Step 2: Render the React app
 * 
 * root.render() starts the React rendering process.
 * Whatever JSX we pass here becomes the entire app.
 */
root.render(
  /**
   * 📖 React.StrictMode
   * 
   * A development-only wrapper that helps find potential problems:
   * - Identifies unsafe lifecycles
   * - Warns about deprecated API usage
   * - Detects unexpected side effects
   * - Ensures reusable state
   * 
   * 📌 NOTE: StrictMode causes components to render TWICE in development!
   * This is intentional - it helps find side effect bugs.
   * In production, it renders only once.
   */
  <React.StrictMode>
    {/**
     * 📖 BrowserRouter
     * 
     * Wraps the entire app to enable React Router.
     * Must be at the top level for <Routes>, <Route>, <Link> to work.
     * 
     * What it does:
     * - Listens to browser URL changes
     * - Provides context for routing components
     * - Manages browser history for back/forward navigation
     */}
    <BrowserRouter>
      {/**
       * 📖 Routes Container
       * 
       * Contains all Route definitions.
       * React Router matches the current URL against these routes
       * and renders the matching component.
       */}
      <Routes>
        {/**
         * 📖 Catch-All Route
         * 
         * path="/*" matches ALL paths:
         * - / (root)
         * - /orders
         * - /holdings
         * - /anything-else
         * 
         * Home component handles sub-routing via Dashboard.
         * 
         * 📌 WHY "/*"?
         * The asterisk (*) makes this a "catch-all" or "wildcard" route.
         * It matches the path and all nested paths.
         * This allows Dashboard.js to define more specific routes.
         */}
        <Route path="/*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

/**
 * ===================================================================================
 *                           📌 SUMMARY & CHEAT SHEET
 * ===================================================================================
 * 
 * 🎯 WHAT THIS FILE DOES:
 * -----------------------
 * 1. Imports React and ReactDOM
 * 2. Imports BrowserRouter for routing
 * 3. Imports global CSS styles
 * 4. Imports the Home component
 * 5. Creates a React root attached to <div id="root">
 * 6. Renders the app wrapped in StrictMode and BrowserRouter
 * 
 * 🎯 APP STRUCTURE:
 * -----------------
 * 
 *     <React.StrictMode>
 *         <BrowserRouter>
 *             <Routes>
 *                 <Route path="/*" element={<Home />} />
 *             </Routes>
 *         </BrowserRouter>
 *     </React.StrictMode>
 * 
 * 🎯 KEY FILES:
 * -------------
 * - public/index.html → Contains <div id="root">
 * - src/index.js → This file (entry point)
 * - src/index.css → Global styles
 * - src/components/Home.js → Main app component
 * 
 * 🎯 INTERVIEW QUESTIONS:
 * -----------------------
 * Q: "What is the entry point of a React app?"
 * A: "index.js is the entry point. It uses ReactDOM.createRoot() to mount
 *    the React application to the DOM element with id='root' in index.html."
 * 
 * Q: "What is React.StrictMode?"
 * A: "StrictMode is a development tool that helps identify potential issues.
 *    It intentionally double-renders components to catch side effects and
 *    warns about deprecated APIs. It has no effect in production."
 * 
 * Q: "Why do you wrap the app in BrowserRouter?"
 * A: "BrowserRouter enables client-side routing using the HTML5 History API.
 *    It allows navigation between pages without full page reloads, making
 *    the app feel like a native application (SPA - Single Page Application)."
 * 
 * Q: "What's the difference between React 17 and React 18 rendering?"
 * A: "React 18 introduced createRoot() API which enables concurrent features
 *    like automatic batching, transitions, and improved Suspense. The old
 *    ReactDOM.render() is deprecated."
 * 
 * ===================================================================================
 */
