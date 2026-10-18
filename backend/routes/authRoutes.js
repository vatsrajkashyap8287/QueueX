import express from "express";

import {
  registerUser,
  loginUser,
  getMe,
} from "../controllers/authController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

import {
  registerValidation,
  loginValidation,
} from "../validators/authValidators.js";

import validateRequest from "../middleware/validateRequest.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Register new user
router.post(
  "/register",
  registerValidation,
  validateRequest,
  registerUser
);

// Login existing user
router.post(
  "/login",
  loginValidation,
  validateRequest,
  loginUser
);

// ==========================================
// PROTECTED ROUTES
// ==========================================

// Get logged-in user
router.get(
  "/me",
  protect,
  getMe
);

// ==========================================
// ADMIN-ONLY ROUTE
// ==========================================

router.get(
  "/admin",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome Admin!",
    });
  }
);

export default router;