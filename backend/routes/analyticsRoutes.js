import express from "express";

import {
  getAdminAnalytics,
  getAdminChartAnalytics
} from "../controllers/analyticsController.js";

import {
  protect,
  authorizeRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

// =====================================
// Authentication
// =====================================

// All analytics routes require JWT
router.use(protect);

// =====================================
// Admin Analytics Overview
// =====================================

router.get(
  "/admin",
  authorizeRoles("admin"),
  getAdminAnalytics
);

// =====================================
// Admin Analytics Charts
// =====================================

router.get(
  "/admin/charts",
  authorizeRoles("admin"),
  getAdminChartAnalytics
);

export default router;