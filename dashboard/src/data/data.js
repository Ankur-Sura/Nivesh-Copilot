/**
 * ===================================================================================
 *                     DATA.JS - Static Data for the Application 📊
 * ===================================================================================
 * 
 * 📚 WHAT IS THIS FILE?
 * ---------------------
 * This file contains STATIC DATA used to initialize the application.
 * It serves as initial/fallback data before real data is fetched from the backend.
 * 
 * 🔗 HOW IT'S USED:
 * -----------------
 * 
 *     data.js (This file)
 *         │
 *         ├── watchlist → WatchList.js (initial stock list)
 *         │
 *         ├── holdings → Holdings.js (sample holdings, replaced by MongoDB data)
 *         │
 *         └── positions → Positions.js (intraday positions)
 * 
 * 📌 WHY STATIC DATA?
 * -------------------
 * 1. Initial Load: Shows something while real data is fetching
 * 2. Fallback: If backend is down, app still shows sample data
 * 3. Development: Easy testing without needing backend running
 * 4. Stock List: Defines which stocks to show in watchlist
 * 
 * 📌 DATA SOURCES IN PRODUCTION:
 * ------------------------------
 * - Watchlist Prices: Fetched from Yahoo Finance via backend
 * - Holdings: Fetched from MongoDB via backend
 * - Positions: Fetched from MongoDB via backend
 * 
 * 📌 INTERVIEW KEY POINTS:
 * -----------------------
 * "I use static data for initialization and as a fallback. The watchlist array
 * defines which stocks to track, then real-time prices are fetched from Yahoo
 * Finance. Holdings are fetched from MongoDB and replace this sample data."
 * 
 * ===================================================================================
 *                           DATA STRUCTURES
 * ===================================================================================
 * 
 * 📌 WATCHLIST ITEM:
 * {
 *   name: "RELIANCE",    // Stock symbol (NSE)
 *   price: 2850.25,      // Initial price (will be updated)
 *   percent: "+1.5%",    // Change percentage (string)
 *   isDown: false        // true if price decreased
 * }
 * 
 * 📌 HOLDING ITEM:
 * {
 *   name: "TCS",         // Stock symbol
 *   qty: 10,             // Quantity owned
 *   avg: 3200.50,        // Average buy price
 *   price: 3250.75,      // Current price
 *   net: "+1.5%",        // Net change (string)
 *   day: "+0.5%",        // Today's change (string)
 *   isLoss: false        // true if in loss
 * }
 * 
 * 📌 POSITION ITEM (Intraday):
 * {
 *   product: "CNC",      // Product type (CNC/MIS)
 *   name: "EVEREADY",    // Stock symbol
 *   qty: 2,              // Quantity
 *   avg: 316.27,         // Average buy price
 *   price: 312.35,       // Current price
 *   net: "+0.58%",       // Net change
 *   day: "-1.24%",       // Today's change
 *   isLoss: true         // true if in loss
 * }
 * 
 * ===================================================================================
 */

// =============================================================================
//                           WATCHLIST DATA
// =============================================================================

/**
 * 📖 Watchlist Array
 * 
 * List of stocks to display in the left sidebar.
 * These are the stocks the user is "watching" for potential trades.
 * 
 * 📌 HOW IT WORKS:
 * 1. WatchList.js imports this array
 * 2. Displays each stock with initial price
 * 3. Fetches real prices from backend → Yahoo Finance
 * 4. Updates prices in real-time
 * 
 * 📌 ADDING NEW STOCKS:
 * Just add a new object to this array:
 * {
 *   name: "STOCKSYMBOL",
 *   price: 0,           // Will be replaced by real price
 *   percent: "+0.00%",  // Will be replaced
 *   isDown: false       // Will be replaced
 * }
 * 
 * 📌 POPULAR INDIAN STOCKS INCLUDED:
 * - IT: INFY, TCS, WIPRO, KPITTECH
 * - Banking: HDFCBANK, ICICIBANK, SBIN, AXISBANK, KOTAKBANK
 * - Conglomerate: RELIANCE, M&M, LT, TITAN
 * - FMCG: HUL, ITC, ASIANPAINT
 * - Pharma: SUNPHARMA
 * - Auto: MARUTI
 * - Cement: ULTRACEMCO
 * - Power: POWERGRID, ONGC
 * - Telecom: BHARTIARTL
 * - Finance: BAJFINANCE
 */
export const watchlist = [
  // ============= IT SECTOR =============
  {
    name: "INFY",           // Infosys Limited
    price: 1629.45,
    percent: "+1.99%",
    isDown: false,
  },
  {
    name: "TCS",            // Tata Consultancy Services
    price: 3259.80,
    percent: "+0.92%",
    isDown: false,
  },
  {
    name: "WIPRO",          // Wipro Limited
    price: 259.60,
    percent: "+1.04%",
    isDown: false,
  },
  {
    name: "KPITTECH",       // KPIT Technologies
    price: 1263.45,
    percent: "-0.54%",
    isDown: true,
  },
  {
    name: "QUICKHEAL",      // Quick Heal Technologies
    price: 291.75,
    percent: "-0.21%",
    isDown: true,
  },
  
  // ============= BANKING SECTOR =============
  {
    name: "HDFCBANK",       // HDFC Bank
    price: 1842.50,
    percent: "+0.45%",
    isDown: false,
  },
  {
    name: "ICICIBANK",      // ICICI Bank
    price: 1298.75,
    percent: "+0.82%",
    isDown: false,
  },
  {
    name: "SBIN",           // State Bank of India
    price: 812.30,
    percent: "+1.15%",
    isDown: false,
  },
  {
    name: "AXISBANK",       // Axis Bank
    price: 1142.60,
    percent: "-0.28%",
    isDown: true,
  },
  {
    name: "KOTAKBANK",      // Kotak Mahindra Bank
    price: 1756.30,
    percent: "+0.33%",
    isDown: false,
  },
  
  // ============= CONGLOMERATES & DIVERSIFIED =============
  {
    name: "RELIANCE",       // Reliance Industries
    price: 1532.40,
    percent: "-0.21%",
    isDown: true,
  },
  {
    name: "M&M",            // Mahindra & Mahindra
    price: 3706.80,
    percent: "+0.96%",
    isDown: false,
  },
  {
    name: "LT",             // Larsen & Toubro
    price: 3542.15,
    percent: "+0.71%",
    isDown: false,
  },
  {
    name: "TITAN",          // Titan Company
    price: 3456.70,
    percent: "+0.88%",
    isDown: false,
  },
  
  // ============= FMCG SECTOR =============
  {
    name: "HUL",            // Hindustan Unilever
    price: 512.40,
    percent: "+1.04%",
    isDown: false,
  },
  {
    name: "ITC",            // ITC Limited
    price: 465.25,
    percent: "+0.54%",
    isDown: false,
  },
  {
    name: "ASIANPAINT",     // Asian Paints
    price: 2845.60,
    percent: "-0.42%",
    isDown: true,
  },
  
  // ============= OIL & GAS =============
  {
    name: "ONGC",           // Oil and Natural Gas Corporation
    price: 242.43,
    percent: "+0.08%",
    isDown: false,
  },
  
  // ============= METALS =============
  {
    name: "TATASTEEL",      // Tata Steel
    price: 142.85,
    percent: "-0.35%",
    isDown: true,
  },
  
  // ============= FINANCIAL SERVICES =============
  {
    name: "BAJFINANCE",     // Bajaj Finance
    price: 6892.40,
    percent: "+0.68%",
    isDown: false,
  },
  
  // ============= TELECOM =============
  {
    name: "BHARTIARTL",     // Bharti Airtel
    price: 1678.90,
    percent: "+0.92%",
    isDown: false,
  },
  
  // ============= AUTO =============
  {
    name: "MARUTI",         // Maruti Suzuki
    price: 11245.80,
    percent: "+0.65%",
    isDown: false,
  },
  
  // ============= PHARMA =============
  {
    name: "SUNPHARMA",      // Sun Pharmaceutical
    price: 1823.45,
    percent: "+1.12%",
    isDown: false,
  },
  
  // ============= CEMENT =============
  {
    name: "ULTRACEMCO",     // UltraTech Cement
    price: 11892.30,
    percent: "-0.15%",
    isDown: true,
  },
  
  // ============= POWER =============
  {
    name: "POWERGRID",      // Power Grid Corporation
    price: 312.45,
    percent: "+0.62%",
    isDown: false,
  },
];

// =============================================================================
//                           HOLDINGS DATA (Sample)
// =============================================================================

/**
 * 📖 Holdings Array (Sample Data)
 * 
 * Sample stock holdings for development/testing.
 * In production, this is REPLACED by MongoDB data.
 * 
 * 📌 FIELDS:
 * - name: Stock symbol
 * - qty: Quantity owned
 * - avg: Average buy price (cost basis)
 * - price: Current market price
 * - net: Net percentage change from avg (profit/loss %)
 * - day: Today's percentage change
 * - isLoss: true if day change is negative (for coloring)
 * 
 * 📌 NOTE:
 * The Holdings.js component fetches real holdings from MongoDB:
 *   GET http://localhost:3002/allHoldings
 * 
 * This static data is NOT used in production.
 */
export const holdings = [
  {
    name: "BHARTIARTL",
    qty: 2,
    avg: 538.05,
    price: 541.15,
    net: "+0.58%",
    day: "+2.99%",
  },
  {
    name: "HDFCBANK",
    qty: 2,
    avg: 1383.4,
    price: 1522.35,
    net: "+10.04%",
    day: "+0.11%",
  },
  {
    name: "HINDUNILVR",
    qty: 1,
    avg: 2335.85,
    price: 2417.4,
    net: "+3.49%",
    day: "+0.21%",
  },
  {
    name: "INFY",
    qty: 1,
    avg: 1350.5,
    price: 1555.45,
    net: "+15.18%",
    day: "-1.60%",
    isLoss: true,
  },
  {
    name: "ITC",
    qty: 5,
    avg: 202.0,
    price: 207.9,
    net: "+2.92%",
    day: "+0.80%",
  },
  {
    name: "KPITTECH",
    qty: 5,
    avg: 250.3,
    price: 266.45,
    net: "+6.45%",
    day: "+3.54%",
  },
  {
    name: "M&M",
    qty: 2,
    avg: 809.9,
    price: 779.8,
    net: "-3.72%",
    day: "-0.01%",
    isLoss: true,
  },
  {
    name: "RELIANCE",
    qty: 1,
    avg: 2193.7,
    price: 2112.4,
    net: "-3.71%",
    day: "+1.44%",
  },
  {
    name: "SBIN",
    qty: 4,
    avg: 324.35,
    price: 430.2,
    net: "+32.63%",
    day: "-0.34%",
    isLoss: true,
  },
  {
    name: "SGBMAY29",      // Sovereign Gold Bond
    qty: 2,
    avg: 4727.0,
    price: 4719.0,
    net: "-0.17%",
    day: "+0.15%",
  },
  {
    name: "TATAPOWER",
    qty: 5,
    avg: 104.2,
    price: 124.15,
    net: "+19.15%",
    day: "-0.24%",
    isLoss: true,
  },
  {
    name: "TCS",
    qty: 1,
    avg: 3041.7,
    price: 3194.8,
    net: "+5.03%",
    day: "-0.25%",
    isLoss: true,
  },
  {
    name: "WIPRO",
    qty: 4,
    avg: 489.3,
    price: 577.75,
    net: "+18.08%",
    day: "+0.32%",
  },
];

// =============================================================================
//                           POSITIONS DATA (Sample)
// =============================================================================

/**
 * 📖 Positions Array (Sample Data)
 * 
 * Sample intraday trading positions.
 * 
 * 📌 FIELDS:
 * - product: CNC (Cash and Carry) or MIS (Margin Intraday Square-off)
 * - name: Stock symbol
 * - qty: Quantity
 * - avg: Average buy price
 * - price: Current price
 * - net: Net change %
 * - day: Today's change %
 * - isLoss: true if in loss
 * 
 * 📌 CNC vs MIS:
 * - CNC: Delivery trading (hold overnight, no leverage)
 * - MIS: Intraday trading (auto squared-off at 3:20 PM, with leverage)
 */
export const positions = [
  {
    product: "CNC",
    name: "EVEREADY",
    qty: 2,
    avg: 316.27,
    price: 312.35,
    net: "+0.58%",
    day: "-1.24%",
    isLoss: true,
  },
  {
    product: "CNC",
    name: "JUBLFOOD",      // Jubilant FoodWorks
    qty: 1,
    avg: 3124.75,
    price: 3082.65,
    net: "+10.04%",
    day: "-1.35%",
    isLoss: true,
  },
];

/**
 * ===================================================================================
 *                           📌 SUMMARY & CHEAT SHEET
 * ===================================================================================
 * 
 * 🎯 WHAT THIS FILE PROVIDES:
 * ---------------------------
 * - watchlist: 25 popular Indian stocks for the watchlist sidebar
 * - holdings: Sample portfolio (replaced by MongoDB in production)
 * - positions: Sample intraday positions
 * 
 * 🎯 USAGE:
 * ---------
 * import { watchlist, holdings, positions } from "../data/data";
 * 
 * 🎯 DATA FLOW:
 * -------------
 * Initialization: data.js → Components → UI
 * Production: MongoDB → Backend API → Components → UI (replaces data.js)
 * 
 * 🎯 STOCK SYMBOLS:
 * -----------------
 * All symbols are NSE (National Stock Exchange) codes.
 * Yahoo Finance uses: SYMBOL.NS (e.g., RELIANCE.NS)
 * 
 * 🎯 INTERVIEW QUESTIONS:
 * -----------------------
 * Q: "Why have static data if you fetch from MongoDB?"
 * A: "Static data serves multiple purposes: fast initial load while real data
 *    fetches, fallback if backend is down, and defines which stocks appear in
 *    the watchlist. For holdings, MongoDB data replaces static data."
 * 
 * Q: "How do you keep prices updated?"
 * A: "WatchList.js uses this static list for stock symbols, then fetches real
 *    prices from Yahoo Finance via the backend. Prices update on page load
 *    and can be refreshed periodically."
 * 
 * ===================================================================================
 */
