const mongoose = require("mongoose");

const budgetAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    threshold: {
      // 0.8 for 80% and 1 for 100%
      type: Number,
      required: true,
      enum: [0.8, 1],
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

budgetAlertSchema.index({ user: 1, year: 1, month: 1, threshold: 1 }, { unique: true });

module.exports = mongoose.model("BudgetAlert", budgetAlertSchema);

