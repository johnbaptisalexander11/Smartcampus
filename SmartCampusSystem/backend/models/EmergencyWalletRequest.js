const mongoose = require("mongoose");

const emergencyWalletRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["pending", "fulfilled", "rejected", "cancelled"],
      default: "pending",
    },
    fulfilledAmount: {
      type: Number,
      default: null,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmergencyWalletRequest", emergencyWalletRequestSchema);

