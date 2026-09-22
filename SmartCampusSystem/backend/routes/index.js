const express = require("express");
const authRoutes = require("./authRoutes");
const foodOrderingRoutes = require("./foodOrdering/foodOrderingRoutes");
const walletRoutes = require("./wallet/walletRoutes");
const complaintRoutes = require("./complaints/complaintRoutes");
const foodSharingRoutes = require("./foodSharing/foodSharingRoutes");
const groupStudyRoutes = require("./groupStudy/groupStudyRoutes");
const adminRoutes = require("./admin/adminRoutes");
const vendorRoutes = require("./vendor/vendorRoutes");
const aiRoutes = require("./aiRoutes");
const { sendSuccess } = require("../utils/apiResponse");

const router = express.Router();

router.get("/health", (req, res) => {
  return sendSuccess(res, "API healthy", null, 200);
});

router.use("/auth", authRoutes);
router.use("/food-ordering", foodOrderingRoutes);
router.use("/wallet", walletRoutes);
router.use("/complaints", complaintRoutes);
router.use("/food-sharing", foodSharingRoutes);
router.use("/group-study", groupStudyRoutes);
router.use("/admin", adminRoutes);
router.use("/vendor", vendorRoutes);
router.use("/ai", aiRoutes);

module.exports = router;
