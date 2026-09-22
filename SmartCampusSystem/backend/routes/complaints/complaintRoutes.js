const express = require("express");
const { protect, authorizeRoles } = require("../../middleware/authMiddleware");
const {
  validateComplaintCreate,
  validateComplaintStatusUpdate,
} = require("../../validations/complaintValidation");
const {
  submitComplaint,
  getComplaintList,
  getComplaintById,
  updateComplaintStatus,
} = require("../../controllers/complaints/complaintController");

const router = express.Router();

router.post("/", protect, validateComplaintCreate, submitComplaint);
router.get("/", protect, getComplaintList);
router.get("/:complaintId", protect, getComplaintById);
router.patch(
  "/:complaintId/status",
  protect,
  authorizeRoles("admin"),
  validateComplaintStatusUpdate,
  updateComplaintStatus
);

module.exports = router;
