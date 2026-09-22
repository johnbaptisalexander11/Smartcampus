const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const {
  validateTopUp,
  validateOrderPayment,
  validateSetMonthlyFoodBudget,
  validateEmergencyWalletRequest,
  validateRefundCancelledOrder,
  validateTransferInitiate,
  validateTransferConfirm,
} = require("../../validations/walletValidation");
const {
  getWalletBalance,
  topUpWallet,
  lookupTransferRecipient,
  initiateWalletTransfer,
  confirmWalletTransferOtp,
  getTransferHistory,
  getWalletNotifications,
  markWalletNotificationRead,
  payForOrder,
  getTransactionHistory,
  getMonthlySpendingSummary,
  getMonthlyFoodBudget,
  setMonthlyFoodBudget,
  getDailySpendingSummary,
  getRewardPointsTransactions,
  createEmergencyWalletRequest,
  getMyEmergencyWalletRequests,
  refundCancelledOrder,
} = require("../../controllers/wallet/walletController");

const router = express.Router();

router.get("/", protect, getWalletBalance);
router.post("/topup", protect, validateTopUp, topUpWallet);
router.get("/transfer/lookup", protect, lookupTransferRecipient);
router.post("/transfer", protect, validateTransferInitiate, initiateWalletTransfer);
router.post("/transfer/confirm-otp", protect, validateTransferConfirm, confirmWalletTransferOtp);
router.get("/transfers", protect, getTransferHistory);
router.get("/notifications", protect, getWalletNotifications);
router.patch("/notifications/:notificationId/read", protect, markWalletNotificationRead);
router.post("/pay-order", protect, validateOrderPayment, payForOrder);
router.get("/budget", protect, getMonthlyFoodBudget);
router.put("/budget", protect, validateSetMonthlyFoodBudget, setMonthlyFoodBudget);
router.get("/transactions", protect, getTransactionHistory);
router.get("/monthly-summary", protect, getMonthlySpendingSummary);
router.get("/daily-spending", protect, getDailySpendingSummary);
router.get("/reward-points", protect, getRewardPointsTransactions);

router.post("/emergency-request", protect, validateEmergencyWalletRequest, createEmergencyWalletRequest);
router.get("/emergency-requests/me", protect, getMyEmergencyWalletRequests);

router.post("/refund-order", protect, validateRefundCancelledOrder, refundCancelledOrder);

module.exports = router;
