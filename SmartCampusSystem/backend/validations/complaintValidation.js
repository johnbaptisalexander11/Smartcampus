const { sendError } = require("../utils/apiResponse");

const validateComplaintCreate = (req, res, next) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return sendError(res, "title and description are required", 400);
  }
  next();
};

const validateComplaintStatusUpdate = (req, res, next) => {
  const allowed = ["open", "in_progress", "resolved", "rejected"];
  const { status } = req.body;
  if (!allowed.includes(status)) {
    return sendError(res, "Invalid complaint status", 400);
  }
  next();
};

module.exports = {
  validateComplaintCreate,
  validateComplaintStatusUpdate,
};
