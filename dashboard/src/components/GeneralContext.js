/**
 * ===================================================================================
 *                     GENERAL CONTEXT - Global State Management 🌐
 * ===================================================================================
 * 
 * 📚 WHAT IS THIS FILE?
 * ---------------------
 * This file creates a React Context for managing GLOBAL STATE across the app.
 * Specifically, it manages the Buy/Sell action window (BuyActionWindow.js).
 * 
 * 🔗 WHAT IS REACT CONTEXT?
 * -------------------------
 * React Context is a way to pass data through the component tree without 
 * having to pass props manually at every level ("prop drilling").
 * 
 * Problem without Context:
 *     <App>
 *       <Dashboard prop={data}>
 *         <WatchList prop={data}>
 *           <WatchListItem prop={data}>
 *             <WatchListActions prop={data}>  ← SO MANY PROPS!
 *             
 * Solution with Context:
 *     <GeneralContextProvider>     ← Wraps app, provides data
 *       <Dashboard>
 *         <WatchList>
 *           <WatchListActions />   ← Gets data directly from context!
 * 
 * 📌 INTERVIEW KEY POINTS:
 * -----------------------
 * "I use React Context API for global state management. It's lighter than Redux
 * for small apps. The GeneralContext manages the Buy/Sell modal state - any
 * component can open it by calling context.openBuyWindow()."
 * 
 * ===================================================================================
 *                           CONTEXT ARCHITECTURE
 * ===================================================================================
 * 
 *     ┌─────────────────────────────────────────────────────────────────┐
 *     │                     GeneralContextProvider                      │
 *     │                                                                  │
 *     │  State:                                                          │
 *     │  - isWindowOpen: boolean (is modal visible?)                     │
 *     │  - selectedStockUID: string (which stock? e.g., "RELIANCE")     │
 *     │  - selectedStockPrice: number (price to prefill)                │
 *     │  - orderMode: "BUY" | "SELL"                                    │
 *     │                                                                  │
 *     │  Methods (exposed via context):                                  │
 *     │  - openBuyWindow(uid, price)  → Opens BuyActionWindow for buying │
 *     │  - openSellWindow(uid, price) → Opens BuyActionWindow for selling│
 *     │  - closeBuyWindow()           → Closes the modal                 │
 *     │                                                                  │
 *     └─────────────────────────────────────────────────────────────────┘
 *                                    │
 *                    Wraps the entire Dashboard
 *                                    │
 *                                    ▼
 *     ┌─────────────────────────────────────────────────────────────────┐
 *     │  Any child component can access:                                │
 *     │                                                                  │
 *     │  const context = useContext(GeneralContext);                    │
 *     │  context.openBuyWindow("TCS", 3250);  // Opens buy window       │
 *     │                                                                  │
 *     └─────────────────────────────────────────────────────────────────┘
 * 
 * ===================================================================================
 */

// =============================================================================
//                           IMPORTS
// =============================================================================

import React, { useState } from "react";
/**
 * 📖 React Import
 * 
 * - React: Required for JSX and React.createContext()
 * - useState: Hook for managing component state
 */

import BuyActionWindow from "./BuyActionWindow";
/**
 * 📖 BuyActionWindow Import
 * 
 * The modal component that we conditionally render.
 * When isWindowOpen is true, this component is displayed.
 */

// =============================================================================
//                           CREATE CONTEXT
// =============================================================================

/**
 * 📖 Creating the Context
 * 
 * React.createContext() creates a Context object.
 * The default value (the argument) is used when a component doesn't have
 * a matching Provider above it in the tree.
 * 
 * 📌 PATTERN:
 *     const MyContext = React.createContext(defaultValue);
 * 
 * The default value here defines the "shape" of our context:
 * - openBuyWindow: function to open buy window
 * - openSellWindow: function to open sell window  
 * - closeBuyWindow: function to close window
 */
const GeneralContext = React.createContext({
  openBuyWindow: (uid, price) => {},   // Default: empty function
  openSellWindow: (uid, price) => {},  // Default: empty function
  closeBuyWindow: () => {},             // Default: empty function
});

// =============================================================================
//                           CONTEXT PROVIDER COMPONENT
// =============================================================================

/**
 * 📖 GeneralContextProvider Component
 * 
 * This is the PROVIDER that wraps parts of the app that need context access.
 * It holds the actual state and provides the real implementations of
 * openBuyWindow, openSellWindow, and closeBuyWindow.
 * 
 * 📌 USAGE:
 *     // In Dashboard.js or App.js:
 *     <GeneralContextProvider>
 *       <WatchList />   // Can now use context!
 *       <Holdings />    // Can now use context!
 *     </GeneralContextProvider>
 * 
 * 📌 HOW IT WORKS:
 * 1. Provider wraps children
 * 2. State is managed here (isWindowOpen, selectedStockUID, etc.)
 * 3. Methods to modify state are passed via context value
 * 4. Any child can call context.openBuyWindow() to update state
 * 5. When state changes, BuyActionWindow renders/un-renders
 */
export const GeneralContextProvider = (props) => {
  // ===========================================================================
  //                     STATE MANAGEMENT
  // ===========================================================================
  
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  /**
   * 📖 isWindowOpen State
   * 
   * Controls visibility of BuyActionWindow modal.
   * - true: Modal is visible
   * - false: Modal is hidden
   */

  const [selectedStockUID, setSelectedStockUID] = useState("");
  /**
   * 📖 selectedStockUID State
   * 
   * The stock symbol for the current trade.
   * e.g., "RELIANCE", "TCS", "INFY"
   */

  const [selectedStockPrice, setSelectedStockPrice] = useState(0);
  /**
   * 📖 selectedStockPrice State
   * 
   * The current price of the selected stock.
   * This prefills the price field in BuyActionWindow.
   */

  const [orderMode, setOrderMode] = useState("BUY");
  /**
   * 📖 orderMode State
   * 
   * Determines if it's a buy or sell order.
   * - "BUY": Green button, user is buying shares
   * - "SELL": Red button, user is selling shares
   */

  // ===========================================================================
  //                     HANDLER FUNCTIONS
  // ===========================================================================

  /**
   * 📖 handleOpenBuyWindow
   * 
   * Opens the BuyActionWindow in BUY mode.
   * Called when user clicks "Buy" button anywhere in the app.
   * 
   * @param {string} uid - Stock symbol (e.g., "RELIANCE")
   * @param {number} price - Current stock price (optional, defaults to 0)
   * 
   * 📌 FLOW:
   * 1. WatchListActions calls context.openBuyWindow("TCS", 3250)
   * 2. This function is called with uid="TCS", price=3250
   * 3. State updated → isWindowOpen=true, selectedStockUID="TCS"
   * 4. React re-renders → BuyActionWindow appears with TCS data
   */
  const handleOpenBuyWindow = (uid, price = 0) => {
    setIsWindowOpen(true);
    setSelectedStockUID(uid);
    setSelectedStockPrice(price);
    setOrderMode("BUY");
  };

  /**
   * 📖 handleOpenSellWindow
   * 
   * Opens the BuyActionWindow in SELL mode.
   * Same as handleOpenBuyWindow but sets mode to "SELL".
   */
  const handleOpenSellWindow = (uid, price = 0) => {
    setIsWindowOpen(true);
    setSelectedStockUID(uid);
    setSelectedStockPrice(price);
    setOrderMode("SELL");
  };

  /**
   * 📖 handleCloseWindow
   * 
   * Closes the BuyActionWindow and resets all state.
   * Called when:
   * - User clicks Cancel button
   * - User clicks outside the modal
   * - Order is successfully placed
   */
  const handleCloseWindow = () => {
    setIsWindowOpen(false);
    setSelectedStockUID("");
    setSelectedStockPrice(0);
  };

  // ===========================================================================
  //                     RENDER
  // ===========================================================================

  return (
    /**
     * 📖 Context.Provider
     * 
     * The Provider component makes context available to all children.
     * The `value` prop is what consumers will receive when they call useContext.
     * 
     * 📌 PATTERN:
     *     <MyContext.Provider value={{ ...data }}>
     *       {children}
     *     </MyContext.Provider>
     */
    <GeneralContext.Provider
      value={{
        openBuyWindow: handleOpenBuyWindow,   // Function to open buy window
        openSellWindow: handleOpenSellWindow, // Function to open sell window
        closeBuyWindow: handleCloseWindow,    // Function to close window
      }}
    >
      {/* Render all children (e.g., WatchList, Holdings, etc.) */}
      {props.children}
      
      {/* 
        Conditionally render BuyActionWindow when isWindowOpen is true.
        This is the modal that appears when user wants to buy/sell.
        
        📌 CONDITIONAL RENDERING:
            {condition && <Component />}
        
        If isWindowOpen is false, nothing is rendered.
        If isWindowOpen is true, BuyActionWindow is rendered.
      */}
      {isWindowOpen && (
        <BuyActionWindow 
          uid={selectedStockUID}              // Stock symbol
          initialPrice={selectedStockPrice}   // Pre-filled price
          mode={orderMode}                    // "BUY" or "SELL"
          onClose={handleCloseWindow}         // Callback to close
        />
      )}
    </GeneralContext.Provider>
  );
};

// =============================================================================
//                           EXPORT
// =============================================================================

export default GeneralContext;
/**
 * 📖 Default Export
 * 
 * We export the Context object as default.
 * Components that need to consume the context do:
 * 
 *     import GeneralContext from "./GeneralContext";
 *     const context = useContext(GeneralContext);
 * 
 * We also export GeneralContextProvider as a named export.
 * This is used to wrap parts of the app:
 * 
 *     import { GeneralContextProvider } from "./GeneralContext";
 *     <GeneralContextProvider>
 *       <App />
 *     </GeneralContextProvider>
 */

/**
 * ===================================================================================
 *                           📌 SUMMARY & CHEAT SHEET
 * ===================================================================================
 * 
 * 🎯 WHAT THIS FILE PROVIDES:
 * ---------------------------
 * 1. GeneralContext - The context object (for useContext)
 * 2. GeneralContextProvider - The wrapper component (for providing context)
 * 
 * 🎯 CONTEXT VALUE SHAPE:
 * -----------------------
 * {
 *   openBuyWindow: (uid, price) => void,   // Open buy modal
 *   openSellWindow: (uid, price) => void,  // Open sell modal
 *   closeBuyWindow: () => void             // Close modal
 * }
 * 
 * 🎯 HOW TO USE:
 * --------------
 * 
 * 1. WRAP YOUR APP (in Dashboard.js):
 *    import { GeneralContextProvider } from "./GeneralContext";
 *    
 *    <GeneralContextProvider>
 *      <WatchList />
 *    </GeneralContextProvider>
 * 
 * 2. CONSUME IN ANY CHILD (in WatchListActions.js):
 *    import GeneralContext from "./GeneralContext";
 *    
 *    const context = useContext(GeneralContext);
 *    context.openBuyWindow("TCS", 3250);
 * 
 * 🎯 INTERVIEW QUESTIONS:
 * -----------------------
 * Q: "Why use Context instead of Redux?"
 * A: "For smaller apps, Context API is simpler and has no external 
 *    dependencies. Redux is better for complex state with many reducers,
 *    middleware, or time-travel debugging needs."
 * 
 * Q: "How does the Buy/Sell modal know which stock to display?"
 * A: "When openBuyWindow is called, it sets selectedStockUID in state.
 *    BuyActionWindow receives this as the 'uid' prop and uses it to
 *    display the correct stock information."
 * 
 * Q: "What triggers the modal to open?"
 * A: "Any component can call context.openBuyWindow(). This updates
 *    isWindowOpen to true, which triggers a re-render. Since we have
 *    {isWindowOpen && <BuyActionWindow />}, the modal appears."
 * 
 * ===================================================================================
 */
