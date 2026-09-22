const express = require("express");
const { protect, authorizeRoles } = require("../../middleware/authMiddleware");
const {
  getVendorDashboardStats,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getIncomingOrders,
  updateIncomingOrderStatus,
  getRevenueSummary,
} = require("../../controllers/vendor/vendorController");

const router = express.Router();

router.use(protect, authorizeRoles("vendor"));

router.get("/dashboard-stats", getVendorDashboardStats);
router.get("/menu", getMenuItems);
router.post("/menu", createMenuItem);
router.put("/menu/:itemId", updateMenuItem);
router.delete("/menu/:itemId", deleteMenuItem);
router.get("/orders", getIncomingOrders);
router.patch("/orders/:orderId/status", updateIncomingOrderStatus);
router.get("/revenue-summary", getRevenueSummary);

module.exports = router;
