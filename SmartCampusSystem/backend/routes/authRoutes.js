const express = require("express");
const {
  register,
  login,
  verifyPhoneOtp,
  resendPhoneOtp,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
} = require("../controllers/authController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { sendSuccess } = require("../utils/apiResponse");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyPhoneOtp);
router.post("/resend-otp", resendPhoneOtp);
router.post("/forgot-password", forgotPassword);
router.post("/forgot-password/verify-otp", verifyPasswordResetOtp);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getCurrentUser);
router.put("/profile", protect, updateProfile);

// Role-based authorization examples
router.get("/admin-only", protect, authorizeRoles("admin"), (req, res) => {
  return sendSuccess(res, "Welcome admin", { role: req.user.role }, 200);
});

router.get("/vendor-only", protect, authorizeRoles("vendor"), (req, res) => {
  return sendSuccess(res, "Welcome vendor", { role: req.user.role }, 200);
});

module.exports = router;
