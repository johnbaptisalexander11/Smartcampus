const express = require("express");
const { protect, authorizeRoles } = require("../../middleware/authMiddleware");
const { requireCanteenOwner } = require("../../middleware/adminScopeMiddleware");
const {
  getAdminDashboardStats,
  getOrders,
  getCanteenMenu,
  createCanteenMenuItem,
  updateCanteenMenuItem,
  deleteCanteenMenuItem,
  getFoodSharingPosts,
  moderateFoodSharingPost,
  getReportedFoodPosts,
  removeFoodPost,
  getGroupStudyFeedback,
  getUsers,
  updateUserStatus,
  getUserActivityOverview,
  getUserActivityDetails,
  updateUserAccountStatus,
} = require("../../controllers/admin/adminController");

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/dashboard-stats", getAdminDashboardStats);
router.get("/orders", getOrders);
router.get("/users", getUsers);
router.patch("/users/:userId/status", updateUserStatus);
router.get("/users/activity", getUserActivityOverview);
router.get("/users/:userId/activity", getUserActivityDetails);
router.patch("/users/:userId/account-status", updateUserAccountStatus);

router.get("/canteen/menu", requireCanteenOwner, getCanteenMenu);
router.post("/canteen/menu", requireCanteenOwner, createCanteenMenuItem);
router.patch("/canteen/menu/:itemId", requireCanteenOwner, updateCanteenMenuItem);
router.delete("/canteen/menu/:itemId", requireCanteenOwner, deleteCanteenMenuItem);

// Food sharing moderation
router.get("/food-sharing", getFoodSharingPosts);
router.get("/food-sharing/reported", getReportedFoodPosts);
router.patch("/food-sharing/:postId/moderate", moderateFoodSharingPost);
router.delete("/food-sharing/:postId", removeFoodPost);
router.get("/group-study-feedback", getGroupStudyFeedback);

module.exports = router;
