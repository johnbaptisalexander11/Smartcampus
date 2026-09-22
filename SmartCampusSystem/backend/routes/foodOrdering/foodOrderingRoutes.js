const express = require("express");
const { protect, authorizeRoles } = require("../../middleware/authMiddleware");
const {
  validateAddToCart,
  validateUpdateCart,
  validateReviewInput,
  validateOrderStatusUpdate,
} = require("../../validations/foodOrderingValidation");
const { getCategories, getMenu, getFoodItemById } = require("../../controllers/foodOrdering/menuController");
const {
  getMyCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../../controllers/foodOrdering/cartController");
const {
  checkout,
  placeOrder,
  getOrderHistory,
  getOrderById,
  updateOrderStatus,
  verifyOrderCode,
  markOrderDelivered,
} = require("../../controllers/foodOrdering/orderController");
const {
  addOrUpdateReview,
  getFoodItemReviews,
} = require("../../controllers/foodOrdering/reviewController");
const { sendSMS } = require("../../services/smsService");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

const router = express.Router();

// Test SMS endpoint (admin only) — remove after confirming SMS works
router.post("/test-sms", protect, authorizeRoles("admin"), async (req, res) => {
  const { phone, message } = req.body;
  if (!phone) return sendError(res, "phone is required", 400);
  const result = await sendSMS(phone, message || "Test SMS from Canteen Management System");
  return sendSuccess(res, result.success ? "SMS sent" : "SMS failed", result, result.success ? 200 : 500);
});

// Menu browsing/search/filter
router.get("/categories", getCategories);
router.get("/menu", getMenu);
router.get("/menu/:itemId", getFoodItemById);

// Cart
router.get("/cart", protect, getMyCart);
router.post("/cart/items", protect, validateAddToCart, addToCart);
router.put("/cart/items/:itemId", protect, validateUpdateCart, updateCartItem);
router.delete("/cart/items/:itemId", protect, removeCartItem);
router.delete("/cart", protect, clearCart);

// Checkout + orders
router.get("/checkout", protect, checkout);
router.post("/orders", protect, placeOrder);
router.get("/orders", protect, getOrderHistory);

// Order code verification (admin/vendor) — must be before /:orderId
router.get("/orders/verify/:code", protect, authorizeRoles("admin", "vendor"), verifyOrderCode);
router.patch("/orders/deliver/:code", protect, authorizeRoles("admin", "vendor"), markOrderDelivered);

router.get("/orders/:orderId", protect, getOrderById);
router.patch(
  "/orders/:orderId/status",
  protect,
  authorizeRoles("admin", "vendor"),
  validateOrderStatusUpdate,
  updateOrderStatus
);

// Ratings and reviews
router.get("/menu/:itemId/reviews", getFoodItemReviews);
router.post("/menu/:itemId/reviews", protect, validateReviewInput, addOrUpdateReview);

module.exports = router;
