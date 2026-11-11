const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

const apiRoutes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { env } = require("./config/env");

const app = express();

// CORS setup for frontend origins
const allowedOrigins = [
  env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Built-in middlewares (large limit so food imageUrl can be data URLs or long links)
const bodyLimit = "12mb";
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

// Logging in development
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Health route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Canteen Management API is running",
  });
});

// Serve uploaded study materials
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB on demand (needed on Vercel, where server.js is not run)
const mongoose = require("mongoose");
const connectDB = require("./config/db");
let dbPromise = null;
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  try {
    dbPromise = dbPromise || connectDB();
    await dbPromise;
    next();
  } catch (err) {
    dbPromise = null;
    next(err);
  }
});

// API routes
app.use("/api", apiRoutes);

// Error middlewares (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
