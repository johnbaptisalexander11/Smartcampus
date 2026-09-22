const { sendError } = require("../utils/apiResponse");

const notFound = (req, res, next) => {
  return sendError(res, `Route not found: ${req.originalUrl}`, 404);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  return sendError(
    res,
    message,
    statusCode,
    process.env.NODE_ENV !== "production" ? err.stack : undefined
  );
};

module.exports = { notFound, errorHandler };
