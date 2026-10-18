import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";

import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { Server } from "socket.io";

// ==========================================
// DATABASE
// ==========================================

import connectDB from "./config/db.js";

import {
  connectRedis,
  redisClient,
} from "./config/redis.js";

// ==========================================
// ROUTES
// ==========================================

import authRoutes from "./routes/authRoutes.js";
import queueRoutes from "./routes/queueRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

// ==========================================
// SOCKET.IO
// ==========================================

import initializeSocket from "./sockets/socketHandler.js";

import {
  setSocketIO,
} from "./sockets/socketEvents.js";

// ==========================================
// ENVIRONMENT VARIABLES
// ==========================================

dotenv.config();

const PORT = process.env.PORT || 5000;

const NODE_ENV =
  process.env.NODE_ENV || "development";

const isProduction = NODE_ENV === "production";

// ==========================================
// ALLOWED FRONTEND ORIGINS
// ==========================================

const allowedOrigins = (
  process.env.CLIENT_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// ==========================================
// INITIALIZE EXPRESS + HTTP SERVER
// ==========================================

const app = express();

const server = http.createServer(app);

// ==========================================
// EXPRESS SECURITY
// ==========================================

// Hide Express identification header.
app.disable("x-powered-by");

// Set secure HTTP response headers.
app.use(helmet());

// ==========================================
// CORS CONFIGURATION
// ==========================================

const corsOptions = {
  origin(origin, callback) {
    // Allow requests without Origin header,
    // such as server-to-server calls.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error("CORS origin not allowed")
    );
  },

  methods: [
    "GET",
    "POST",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  credentials: false,
};

app.use(cors(corsOptions));

// ==========================================
// REQUEST BODY PARSING
// ==========================================

// Limit JSON payload size.
app.use(
  express.json({
    limit: "10kb",
  })
);

// ==========================================
// RATE LIMITING
// ==========================================

// General API limiter.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  // Development: generous limit.
  // Production: stricter limit.
  limit: isProduction ? 300 : 1000,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests. Please wait and try again.",
  },
});

// Authentication limiter.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: isProduction ? 20 : 100,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again later.",
  },
});

// Apply general API limiter.
app.use("/api", apiLimiter);

// ==========================================
// API ROUTES
// ==========================================

// Authentication
app.use(
  "/api/auth",
  authLimiter,
  authRoutes
);

// Queue Management
app.use(
  "/api/queues",
  queueRoutes
);

// Analytics
app.use(
  "/api/analytics",
  analyticsRoutes
);

// ==========================================
// SOCKET.IO CONFIGURATION
// ==========================================

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,

    methods: ["GET", "POST"],

    credentials: false,
  },

  // Maximum Socket.IO message size.
  maxHttpBufferSize: 1e6,

  // Detect disconnected clients.
  pingTimeout: 20000,

  pingInterval: 25000,
});

// Initialize JWT authentication and handlers.
initializeSocket(io);

// Make Socket.IO available to controllers.
setSocketIO(io);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "QueueX Backend Running Successfully",
    environment: NODE_ENV,
  });
});

// ==========================================
// REDIS TEST — DEVELOPMENT ONLY
// ==========================================

if (!isProduction) {
  app.get(
    "/api/redis-test",
    async (req, res, next) => {
      try {
        const response =
          await redisClient.ping();

        res.status(200).json({
          success: true,
          redis: response,
        });
      } catch (error) {
        next(error);
      }
    }
  );
}

// ==========================================
// UNKNOWN API ROUTES
// ==========================================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

// ==========================================
// CENTRALIZED ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error("[QueueX Server Error]", {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
  });

  // Invalid JSON body.
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body.",
    });
  }

  // Payload too large.
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message:
        "Request payload is too large.",
    });
  }

  // Blocked CORS origin.
  if (
    err.message === "CORS origin not allowed"
  ) {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed.",
    });
  }

  const statusCode =
    err.statusCode ||
    err.status ||
    500;

  res.status(
    statusCode >= 400 && statusCode < 600
      ? statusCode
      : 500
  ).json({
    success: false,

    message: isProduction
      ? "An unexpected server error occurred."
      : err.message ||
        "Internal server error.",
  });
});

// ==========================================
// START SERVER
// ==========================================

const startServer = async () => {
  try {
    // Connect MongoDB Atlas.
    await connectDB();

    // Connect Redis Cloud.
    await connectRedis();

    server.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );

      console.log(
        `Environment: ${NODE_ENV}`
      );

      console.log(
        `Allowed frontend origins: ${allowedOrigins.join(", ")}`
      );
    });
  } catch (error) {
    console.error(
      "Startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();