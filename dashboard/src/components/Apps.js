/**
 * ===================================================================================
 *                     APPS COMPONENT - AI Copilot Container 🤖
 * ===================================================================================
 * 
 * 📚 WHAT IS THIS COMPONENT?
 * --------------------------
 * Apps is a simple wrapper component that renders the AI Copilot interface.
 * It's accessed via the "Apps" tab in the navigation menu (/apps route).
 * 
 * 🔗 HOW IT CONNECTS:
 * -------------------
 * 
 *     Dashboard.js
 *         │
 *         └── <Route path="/apps" element={<Apps />} />
 *                     │
 *                     └── Apps.js (This file)
 *                             │
 *                             └── <AICopilot />
 *                                     │
 *                                     ├── Chat interface
 *                                     ├── Voice commands
 *                                     ├── Stock research
 *                                     └── Order detection
 * 
 * 📌 WHY A WRAPPER?
 * -----------------
 * This wrapper allows:
 * 1. Full-screen layout control for the AI interface
 * 2. Easy styling/padding adjustments
 * 3. Future additions (e.g., header, sidebar for AI features)
 * 
 * 📌 INTERVIEW KEY POINTS:
 * -----------------------
 * "The Apps component is a container for the AI Copilot. It provides full-width
 * layout so the chat interface can use the entire content area. The actual AI
 * functionality is in the AICopilot component."
 * 
 * ===================================================================================
 */

// =============================================================================
//                           IMPORTS
// =============================================================================

import React from "react";
/**
 * 📖 React Import
 * 
 * Required for JSX and component creation.
 */

import AICopilot from "./AICopilot";
/**
 * 📖 AICopilot Component
 * 
 * The main AI interface component. Contains:
 * - Chat messages display
 * - Text input for queries
 * - Voice recording button
 * - Order confirmation dialog
 * - Loading states
 * 
 * 🔗 This is where all the AI magic happens!
 * See AICopilot.js for detailed documentation.
 */

// =============================================================================
//                           APPS COMPONENT
// =============================================================================

/**
 * 📖 Apps Component
 * 
 * Simple wrapper that renders AICopilot with full-width/height layout.
 * 
 * 📌 STYLE:
 * - width: 100% → Takes full width of content area
 * - height: 100% → Takes full height of content area
 * 
 * This ensures the AI Copilot has maximum space for the chat interface.
 */
const Apps = () => {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      {/* 
        AICopilot Component
        -------------------
        The main AI interface with:
        - Chat history display
        - Text input for queries
        - Voice recording (Whisper STT)
        - Stock research (7-node LangGraph)
        - Order detection & HITL confirmation
        
        All AI communication flows:
        AICopilot → Backend (3002) → AI Service (8000) → LangGraph
      */}
      <AICopilot />
    </div>
  );
};

export default Apps;

/**
 * ===================================================================================
 *                           📌 SUMMARY
 * ===================================================================================
 * 
 * 🎯 WHAT THIS COMPONENT DOES:
 * ----------------------------
 * Wraps AICopilot in a full-size container for the /apps route.
 * 
 * 🎯 ROUTE:
 * ---------
 * Accessed via: http://localhost:3000/apps
 * Defined in: Dashboard.js → <Route path="/apps" element={<Apps />} />
 * 
 * 🎯 CHILD COMPONENT:
 * -------------------
 * AICopilot - The actual AI interface (1200+ lines of code)
 * 
 * 🎯 INTERVIEW QUESTION:
 * ----------------------
 * Q: "Why have a separate Apps component instead of directly using AICopilot?"
 * A: "Separation of concerns. Apps is the routed page component that handles
 *    layout. AICopilot is a reusable AI interface that could be embedded
 *    elsewhere or have different layout containers in the future."
 * 
 * ===================================================================================
 */
