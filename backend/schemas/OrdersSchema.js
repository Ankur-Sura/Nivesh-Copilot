const { Schema } = require("mongoose");

const OrdersSchema = new Schema({
  name: String,
  qty: Number,
  price: Number,
  mode: String,  // "buy" or "sell"
  is_voice_order: { type: Boolean, default: false },
  is_simulated: { type: Boolean, default: false },
  status: { type: String, default: "executed" },  // "executed", "pending", "cancelled"
}, {
  timestamps: true  // Adds createdAt and updatedAt automatically
});

module.exports = { OrdersSchema };
