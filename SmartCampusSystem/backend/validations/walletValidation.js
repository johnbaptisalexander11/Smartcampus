const { sendError } = require("../utils/apiResponse");

const validateTopUp = (req, res, next) => {
  const { amount } = req.body;
  if (!amount || Number(amount) <= 0) {
    return sendError(res, "Top up amount must be greater than 0", 400);
  }
  next();
};

const validateOrderPayment = (req, res, next) => {
  const { orderId } = req.body;
  if (!orderId) {
    return sendError(res, "orderId is required", 400);
  }
  next();
};

const validateSetMonthlyFoodBudget = (req, res, next) => {
  const { amount } = req.body;
  const parsedAmount = Number(amount);
  if (amount === undefined) {
    return sendError(res, "amount is required", 400);
  }
  if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
    return sendError(res, "amount must be a number >= 0", 400);
  }
  next();
};

const validateEmergencyWalletRequest = (req, res, next) => {
  const { amount } = req.body;
  const parsedAmount = Number(amount);
  if (amount === undefined) {
    return sendError(res, "amount is required", 400);
  }
  if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
    return sendError(res, "amount must be a number >= 1", 400);
  }
  next();
};

const validateRefundCancelledOrder = (req, res, next) => {
  const { orderId } = req.body;
  if (!orderId) {
    return sendError(res, "orderId is required", 400);
  }
  next();
};

const validateTransferInitiate = (req, res, next) => {
  const { receiverIdentifier, amount, password } = req.body;
  if (!receiverIdentifier) return sendError(res, "receiverIdentifier is required", 400);

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return sendError(res, "amount must be greater than 0", 400);
  }

  if (!password || String(password).length < 6) {
    return sendError(res, "password confirmation is required", 400);
  }

  next();
};

const validateTransferConfirm = (req, res, next) => {
  const { transferId, otp } = req.body;
  if (!transferId) return sendError(res, "transferId is required", 400);
  if (!otp || !/^\d{6}$/.test(String(otp).trim())) {
    return sendError(res, "otp must be a 6-digit code", 400);
  }
  next();
};

module.exports = {
  validateTopUp,
  validateOrderPayment,
  validateSetMonthlyFoodBudget,
  validateEmergencyWalletRequest,
  validateRefundCancelledOrder,
  validateTransferInitiate,
  validateTransferConfirm,
};
