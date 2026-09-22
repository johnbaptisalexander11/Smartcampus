const mongoose = require("mongoose");

const rewardPointsTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    // Positive values increase points, negative values decrease points.
    pointsDelta: {
      type: Number,
      required: true,
    },
    kind: {
      type: String,
      enum: ["earned", "redeemed", "reversal"],
      required: true,
    },
    referenceType: {
      type: String,
      enum: ["order", "manual", "budget_refund", "emergency"],
      default: "manual",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model("RewardPointsTransaction", rewardPointsTransactionSchema);

