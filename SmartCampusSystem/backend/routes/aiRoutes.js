const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { assistantHandler } = require("../controllers/aiController");

const router = express.Router();

router.post("/assistant", protect, authorizeRoles("student"), assistantHandler);

module.exports = router;

