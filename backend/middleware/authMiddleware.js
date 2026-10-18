import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../models/User.js";

// ==========================================
// VERIFY JWT
// ==========================================

export const protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    // ======================================
    // CHECK AUTHORIZATION HEADER
    // ======================================

    if (
      typeof authorization !== "string" ||
      !authorization.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    const parts = authorization.split(" ");

    // Reject malformed Bearer headers.
    if (
      parts.length !== 2 ||
      !parts[1]
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization header",
      });
    }

    const token = parts[1];

    // ======================================
    // VERIFY JWT SECRET
    // ======================================

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is missing from environment variables"
      );

      return res.status(500).json({
        success: false,
        message: "Authentication service unavailable",
      });
    }

    // ======================================
    // VERIFY TOKEN
    // ======================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    // ======================================
    // VALIDATE TOKEN PAYLOAD
    // ======================================

    if (
      !decoded ||
      typeof decoded !== "object" ||
      !mongoose.isValidObjectId(decoded.id)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // ======================================
    // FIND USER
    // ======================================

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // Attach authenticated user.
    req.user = user;

    next();
  } catch (error) {
    // ======================================
    // EXPIRED TOKEN
    // ======================================

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message:
          "Your session has expired. Please log in again.",
      });
    }

    // ======================================
    // INVALID TOKEN
    // ======================================

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    // ======================================
    // UNEXPECTED SERVER ERROR
    // ======================================

    console.error(
      "Authentication middleware error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Authentication service temporarily unavailable",
    });
  }
};

// ==========================================
// ROLE-BASED AUTHORIZATION
// ==========================================

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to access this resource",
      });
    }

    next();
  };
};