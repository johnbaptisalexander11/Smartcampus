const { sendError } = require("../utils/apiResponse");

const requireCanteenOwner = (req, res, next) => {
  if (!req.user.canteenKey) {
    return sendError(res, "Only canteen owners can access this resource", 403);
  }
  next();
};

module.exports = { requireCanteenOwner };
