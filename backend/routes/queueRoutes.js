import express from "express";

import {
  createQueue,
  getAllQueues,
  joinQueue,
  getMyQueues,
  getMyQueueHistory,
  leaveQueue,
  callNext,
  completeService,
  getQueueDetails,
  updateQueueStatus,
} from "../controllers/queueController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

import {
  createQueueValidation,
  queueIdValidation,
  entryIdValidation,
  updateQueueStatusValidation,
} from "../validators/queueValidators.js";

import validateRequest from "../middleware/validateRequest.js";

const router = express.Router();

// ==========================================
// ALL ROUTES REQUIRE JWT
// ==========================================

router.use(protect);

// ==========================================
// USER ROUTES
// ==========================================

// Get all available queues
router.get(
  "/",
  getAllQueues
);

// Get user's active queues
router.get(
  "/my",
  getMyQueues
);

// Get user's queue history
router.get(
  "/history",
  getMyQueueHistory
);

// Get queue details
router.get(
  "/:queueId",
  queueIdValidation,
  validateRequest,
  getQueueDetails
);

// Join queue
router.post(
  "/:queueId/join",
  queueIdValidation,
  validateRequest,
  joinQueue
);

// Leave queue
router.delete(
  "/entries/:entryId",
  entryIdValidation,
  validateRequest,
  leaveQueue
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Create queue
router.post(
  "/",
  authorizeRoles("admin"),
  createQueueValidation,
  validateRequest,
  createQueue
);

// Call next customer
router.post(
  "/:queueId/next",
  authorizeRoles("admin"),
  queueIdValidation,
  validateRequest,
  callNext
);

// Complete service
router.patch(
  "/entries/:entryId/complete",
  authorizeRoles("admin"),
  entryIdValidation,
  validateRequest,
  completeService
);

// Pause / Resume / Close / Reopen Queue
router.patch(
  "/:queueId/status",
  authorizeRoles("admin"),
  updateQueueStatusValidation,
  validateRequest,
  updateQueueStatus
);

export default router;