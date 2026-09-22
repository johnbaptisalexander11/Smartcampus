const { sendError } = require("../utils/apiResponse");

const validateAddToCart = (req, res, next) => {
  const { foodItemId, quantity } = req.body;

  if (!foodItemId) {
    return sendError(res, "foodItemId is required", 400);
  }

  if (!quantity || Number(quantity) < 1) {
    return sendError(res, "quantity must be at least 1", 400);
  }

  next();
};

const validateUpdateCart = (req, res, next) => {
  const { quantity } = req.body;

  if (!quantity || Number(quantity) < 1) {
    return sendError(res, "quantity must be at least 1", 400);
  }

  next();
};

const validateReviewInput = (req, res, next) => {
  const { rating, comment } = req.body;

  if (!rating || Number(rating) < 1 || Number(rating) > 5) {
    return sendError(res, "rating must be between 1 and 5", 400);
  }

  if (comment && comment.length > 500) {
    return sendError(res, "comment should be at most 500 characters", 400);
  }

  next();
};

const validateOrderStatusUpdate = (req, res, next) => {
  const allowedStatuses = ["accepted", "preparing", "ready", "completed", "cancelled"];
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return sendError(res, "Invalid status value", 400);
  }

  next();
};

module.exports = {
  validateAddToCart,
  validateUpdateCart,
  validateReviewInput,
  validateOrderStatusUpdate,
};
