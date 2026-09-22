const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { sendError } = require("../utils/apiResponse");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, "Not authorized, token missing", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return sendError(res, "Not authorized, user not found", 401);
    }

    if (user.accountStatus === "blocked" || user.isActive === false) {
      return sendError(res, "Account blocked. Contact admin support.", 403);
    }

    if (user.accountStatus === "suspended") {
      const now = new Date();
      if (user.suspendedUntil && user.suspendedUntil <= now) {
        user.accountStatus = "active";
        user.isActive = true;
        user.statusReason = "";
        user.suspendedUntil = null;
        await user.save();
      } else {
        const msg = user.suspendedUntil
          ? `Account suspended until ${user.suspendedUntil.toLocaleString()}`
          : "Account suspended. Contact admin support.";
        return sendError(res, msg, 403);
      }
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, "Not authorized, invalid token", 401);
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, "Forbidden: You do not have access to this resource", 403);
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
