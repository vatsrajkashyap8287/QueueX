import mongoose from "mongoose";

import Queue from "../models/Queue.js";
import QueueEntry from "../models/QueueEntry.js";

import { emitQueueUpdate } from "../sockets/socketEvents.js";

import {
  addToQueue,
  removeFromQueue,
  getNextEntry,
  getQueuePosition,
  getWaitingCount
} from "../services/queueService.js";

import {
  withQueueLock
} from "../services/queueLockService.js";

import {
  ensureQueueConsistency
} from "../services/queueRecoveryService.js";

import {
  repairQueueAfterFailure
} from "../services/queueConsistencyService.js";

// ==========================================
// CONSTANTS
// ==========================================

const ACTIVE_ENTRY_STATUSES = [
  "waiting",
  "serving"
];

// ==========================================
// RESPONSE HELPERS
// ==========================================

const responseResult = (status, body) => ({
  status,
  body
});

const errorResult = (status, message) =>
  responseResult(status, {
    success: false,
    message
  });

const sendResult = (res, result) =>
  res.status(result.status).json(result.body);

const handleQueueOperationError = (
  res,
  error,
  fallbackMessage
) => {
  if (error.statusCode === 409) {
    return res.status(409).json({
      success: false,
      message: error.message
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message:
        "Queue state changed. Please try again."
    });
  }

  return res.status(500).json({
    success: false,
    message: fallbackMessage
  });
};

// ==========================================
// ACTIVE QUEUE CONFLICT HELPER
// ==========================================

const getActiveQueueConflict = async (
  userId,
  requestedQueueId
) => {
  const activeEntry = await QueueEntry.findOne({
    user: userId,
    status: {
      $in: ACTIVE_ENTRY_STATUSES
    }
  }).populate("queue", "name");

  if (!activeEntry) {
    return null;
  }

  const existingQueueId =
    activeEntry.queue?._id?.toString() ||
    activeEntry.queue?.toString();

  if (
    existingQueueId ===
    requestedQueueId.toString()
  ) {
    return "You already joined this queue";
  }

  const existingQueueName =
    activeEntry.queue?.name ||
    "another queue";

  return (
    `You already have an active token in "${existingQueueName}". ` +
    "Please finish or leave your current queue before joining another."
  );
};

// ==========================================
// CREATE QUEUE (ADMIN)
// ==========================================

export const createQueue = async (req, res) => {
  try {
    const {
      name,
      description,
      averageServiceTime
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid queue name is required"
      });
    }

    const serviceTime = averageServiceTime ?? 5;

    if (
      typeof serviceTime !== "number" ||
      !Number.isFinite(serviceTime) ||
      serviceTime < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid average service time"
      });
    }

    const queue = await Queue.create({
      name: name.trim(),
      description:
        typeof description === "string"
          ? description.trim()
          : "",
      averageServiceTime: serviceTime,
      createdBy: req.user._id
    });

    emitQueueUpdate(queue._id);

    return res.status(201).json({
      success: true,
      message: "Queue created successfully",
      queue
    });
  } catch (error) {
    console.error("Create Queue Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create queue"
    });
  }
};

// ==========================================
// GET ALL QUEUES
// ==========================================

export const getAllQueues = async (req, res) => {
  try {
    let filter = {
      status: { $ne: "closed" }
    };

    if (req.user.role === "admin") {
      filter = {
        createdBy: req.user._id
      };
    }

    const queues = await Queue.find(filter)
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      queues
    });
  } catch (error) {
    console.error("Get Queues Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch queues"
    });
  }
};

// ==========================================
// JOIN QUEUE (USER)
// ONE ACTIVE QUEUE PER USER
// PARTIAL-FAILURE RECOVERY
// ==========================================

export const joinQueue = async (req, res) => {
  const { queueId } = req.params;

  if (!mongoose.isValidObjectId(queueId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid queue ID"
    });
  }

  try {
    const result = await withQueueLock(
      queueId,
      async (lock) => {
        const queue = await Queue.findById(queueId);

        if (!queue) {
          return errorResult(
            404,
            "Queue not found"
          );
        }

        if (queue.status !== "active") {
          return errorResult(
            400,
            "Queue is not accepting users"
          );
        }

        // ----------------------------------
        // GLOBAL ACTIVE QUEUE CHECK
        // ----------------------------------

        const activeQueueConflict =
          await getActiveQueueConflict(
            req.user._id,
            queueId
          );

        if (activeQueueConflict) {
          return errorResult(
            409,
            activeQueueConflict
          );
        }

        // ----------------------------------
        // ISSUE QUEUE-SPECIFIC TOKEN
        // ----------------------------------

        const updatedQueue =
          await Queue.findOneAndUpdate(
            {
              _id: queueId,
              status: "active"
            },
            {
              $inc: {
                lastIssuedToken: 1
              }
            },
            {
              returnDocument: "after"
            }
          );

        if (!updatedQueue) {
          return errorResult(
            400,
            "Queue is no longer active"
          );
        }

        // ----------------------------------
        // CREATE MONGODB ENTRY
        // ----------------------------------

        let entry;

        try {
          entry = await QueueEntry.create({
            queue: queueId,
            user: req.user._id,
            tokenNumber:
              updatedQueue.lastIssuedToken
          });
        } catch (createError) {
          if (createError.code === 11000) {
            const conflict =
              await getActiveQueueConflict(
                req.user._id,
                queueId
              );

            return errorResult(
              409,
              conflict ||
                "Queue state changed. Please try again."
            );
          }

          throw createError;
        }

        // ----------------------------------
        // ADD ENTRY TO REDIS FIFO
        // ----------------------------------

        let redisRecovered = false;

        try {
          await addToQueue(
            queueId,
            entry._id
          );
        } catch (redisError) {
          const recovery =
            await repairQueueAfterFailure(
              queueId,
              lock,
              redisError
            );

          if (!recovery.recovered) {
            return errorResult(
              503,
              "Queue entry was saved, but synchronization failed. Please refresh your dashboard before trying again."
            );
          }

          redisRecovered = true;
        }

        // ----------------------------------
        // GET USER POSITION
        // ----------------------------------

        let position = null;

        try {
          position = await getQueuePosition(
            queueId,
            entry._id
          );
        } catch (positionError) {
          console.error(
            "Join Queue Position Error:",
            positionError.message
          );
        }

        return responseResult(201, {
          success: true,
          message: "Joined queue successfully",
          entry,
          position,
          ...(redisRecovered
            ? { recovered: true }
            : {})
        });
      }
    );

    if (
      result.status === 201 ||
      result.status === 503
    ) {
      emitQueueUpdate(queueId);
    }

    return sendResult(res, result);
  } catch (error) {
    console.error("Join Queue Error:", error);

    if (error.code === 11000) {
      try {
        const conflict =
          await getActiveQueueConflict(
            req.user._id,
            queueId
          );

        return res.status(409).json({
          success: false,
          message:
            conflict ||
            "You already have an active queue entry"
        });
      } catch (lookupError) {
        console.error(
          "Active Conflict Lookup Error:",
          lookupError
        );

        return res.status(409).json({
          success: false,
          message:
            "You already have an active queue entry"
        });
      }
    }

    return handleQueueOperationError(
      res,
      error,
      "Failed to join queue"
    );
  }
};

// ==========================================
// GET MY ACTIVE QUEUES + SMART WAITING TIME
// ==========================================

export const getMyQueues = async (req, res) => {
  try {
    const entries = await QueueEntry.find({
      user: req.user._id,
      status: {
        $in: ACTIVE_ENTRY_STATUSES
      }
    }).populate(
      "queue",
      "name status averageServiceTime currentToken"
    );

    const result = await Promise.all(
      entries.map(async (entry) => {
        const queue = entry.queue;

        let position = null;
        let estimatedWaitingTime = null;
        let currentlyServingToken = null;

        if (!queue) {
          return {
            ...entry.toObject(),
            position,
            estimatedWaitingTime,
            currentlyServingToken
          };
        }

        const currentlyServing =
          await QueueEntry.findOne({
            queue: queue._id,
            status: "serving"
          }).select("tokenNumber");

        if (currentlyServing) {
          currentlyServingToken =
            currentlyServing.tokenNumber;
        }

        if (entry.status === "waiting") {
          position = await getQueuePosition(
            queue._id,
            entry._id
          );

          if (
            typeof position === "number" &&
            position > 0
          ) {
            estimatedWaitingTime =
              position *
              queue.averageServiceTime;
          }
        }

        if (entry.status === "serving") {
          position = 0;
          estimatedWaitingTime = 0;
        }

        return {
          ...entry.toObject(),
          position,
          estimatedWaitingTime,
          currentlyServingToken
        };
      })
    );

    return res.status(200).json({
      success: true,
      entries: result
    });
  } catch (error) {
    console.error("Get My Queues Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your queues"
    });
  }
};

// ==========================================
// LEAVE QUEUE (USER)
// PARTIAL-FAILURE RECOVERY
// ==========================================

export const leaveQueue = async (req, res) => {
  const { entryId } = req.params;

  if (!mongoose.isValidObjectId(entryId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid entry ID"
    });
  }

  try {
    const existingEntry =
      await QueueEntry.findOne({
        _id: entryId,
        user: req.user._id,
        status: "waiting"
      });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: "Active waiting entry not found"
      });
    }

    const queueId = existingEntry.queue;

    const result = await withQueueLock(
      queueId,
      async (lock) => {
        const entry =
          await QueueEntry.findOneAndUpdate(
            {
              _id: entryId,
              user: req.user._id,
              status: "waiting"
            },
            {
              $set: {
                status: "cancelled"
              }
            },
            {
              returnDocument: "after"
            }
          );

        if (!entry) {
          return errorResult(
            404,
            "Active waiting entry not found"
          );
        }

        let redisRecovered = false;

        try {
          await removeFromQueue(
            entry.queue,
            entry._id
          );
        } catch (redisError) {
          const recovery =
            await repairQueueAfterFailure(
              queueId,
              lock,
              redisError
            );

          if (!recovery.recovered) {
            return errorResult(
              503,
              "Queue entry was cancelled, but synchronization failed. Please refresh your dashboard."
            );
          }

          redisRecovered = true;
        }

        return responseResult(200, {
          success: true,
          message: "Left queue successfully",
          ...(redisRecovered
            ? { recovered: true }
            : {})
        });
      }
    );

    if (
      result.status === 200 ||
      result.status === 503
    ) {
      emitQueueUpdate(queueId);
    }

    return sendResult(res, result);
  } catch (error) {
    console.error("Leave Queue Error:", error);

    return handleQueueOperationError(
      res,
      error,
      "Failed to leave queue"
    );
  }
};

// ==========================================
// CALL NEXT CUSTOMER (ADMIN)
// FIFO RECOVERY + PARTIAL-FAILURE HANDLING
// ==========================================

export const callNext = async (req, res) => {
  const { queueId } = req.params;

  if (!mongoose.isValidObjectId(queueId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid queue ID"
    });
  }

  try {
    const result = await withQueueLock(
      queueId,
      async (lock) => {
        const queue = await Queue.findById(queueId);

        if (!queue) {
          return errorResult(
            404,
            "Queue not found"
          );
        }

        if (
          queue.createdBy.toString() !==
          req.user._id.toString()
        ) {
          return errorResult(
            403,
            "You cannot manage this queue"
          );
        }

        if (queue.status !== "active") {
          return errorResult(
            400,
            "Queue is not active"
          );
        }

        const currentlyServing =
          await QueueEntry.findOne({
            queue: queueId,
            status: "serving"
          });

        if (currentlyServing) {
          return errorResult(
            409,
            "Complete current service first"
          );
        }

        // ----------------------------------
        // VERIFY / REPAIR FIFO BEFORE CALL
        // ----------------------------------

        const consistency =
          await ensureQueueConsistency(
            queueId,
            lock
          );

        if (consistency.repaired) {
          console.log(
            `Redis FIFO recovered for queue ${queueId}`
          );
        }

        const nextEntryId =
          await getNextEntry(queueId);

        if (!nextEntryId) {
          return errorResult(
            400,
            "No customers waiting"
          );
        }

        // ----------------------------------
        // UPDATE MONGODB FIRST
        // ----------------------------------

        const entry =
          await QueueEntry.findOneAndUpdate(
            {
              _id: nextEntryId,
              queue: queueId,
              status: "waiting"
            },
            {
              $set: {
                status: "serving",
                servedAt: new Date()
              }
            },
            {
              returnDocument: "after"
            }
          ).populate("user", "name email");

        if (!entry) {
          return errorResult(
            409,
            "Queue state changed. Please retry."
          );
        }

        // MongoDB is now the source of truth.
        // Do not move entry back to waiting if
        // Redis synchronization fails.

        await Queue.findByIdAndUpdate(
          queueId,
          {
            currentToken: entry.tokenNumber
          }
        );

        let redisRecovered = false;

        // ----------------------------------
        // REDIS REMOVAL + RECOVERY
        // ----------------------------------

        try {
          await removeFromQueue(
            queueId,
            entry._id
          );
        } catch (redisError) {
          console.error(
            "Call Next Redis Removal Error:",
            redisError.message
          );

          const recovery =
            await repairQueueAfterFailure(
              queueId,
              lock,
              redisError
            );

          if (!recovery.recovered) {
            return errorResult(
              503,
              "Customer was called, but queue synchronization failed. Please refresh the dashboard before taking another action."
            );
          }

          redisRecovered = true;
        }

        return responseResult(200, {
          success: true,
          message: "Next customer called",
          entry,
          ...(redisRecovered
            ? { recovered: true }
            : {})
        });
      }
    );

    if (
      result.status === 200 ||
      result.status === 503
    ) {
      emitQueueUpdate(queueId);
    }

    return sendResult(res, result);
  } catch (error) {
    console.error("Call Next Error:", error);

    return handleQueueOperationError(
      res,
      error,
      "Failed to call next customer"
    );
  }
};

// ==========================================
// COMPLETE SERVICE (ADMIN)
// RESPONSE AFTER LOCK RELEASE
// ==========================================

export const completeService = async (req, res) => {
  const { entryId } = req.params;

  if (!mongoose.isValidObjectId(entryId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid entry ID"
    });
  }

  try {
    const servingEntry =
      await QueueEntry.findOne({
        _id: entryId,
        status: "serving"
      });

    if (!servingEntry) {
      return res.status(404).json({
        success: false,
        message: "Serving entry not found"
      });
    }

    const queueId = servingEntry.queue;

    const result = await withQueueLock(
      queueId,
      async () => {
        const queue = await Queue.findById(
          queueId
        );

        if (!queue) {
          return errorResult(
            404,
            "Queue not found"
          );
        }

        if (
          queue.createdBy.toString() !==
          req.user._id.toString()
        ) {
          return errorResult(
            403,
            "You cannot manage this queue"
          );
        }

        const entry =
          await QueueEntry.findOneAndUpdate(
            {
              _id: entryId,
              queue: queueId,
              status: "serving"
            },
            {
              $set: {
                status: "completed",
                completedAt: new Date()
              }
            },
            {
              returnDocument: "after"
            }
          );

        if (!entry) {
          return errorResult(
            409,
            "Service was already updated"
          );
        }

        return responseResult(200, {
          success: true,
          message: "Service completed",
          entry
        });
      }
    );

    if (result.status === 200) {
      emitQueueUpdate(queueId);
    }

    return sendResult(res, result);
  } catch (error) {
    console.error(
      "Complete Service Error:",
      error
    );

    return handleQueueOperationError(
      res,
      error,
      "Failed to complete service"
    );
  }
};

// ==========================================
// GET QUEUE DETAILS
// ==========================================

export const getQueueDetails = async (req, res) => {
  try {
    const { queueId } = req.params;

    if (!mongoose.isValidObjectId(queueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid queue ID"
      });
    }

    const queue = await Queue.findById(queueId)
      .populate("createdBy", "name");

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: "Queue not found"
      });
    }

    const waitingCount =
      await getWaitingCount(queueId);

    const currentlyServing =
      await QueueEntry.findOne({
        queue: queueId,
        status: "serving"
      }).populate("user", "name email");

    return res.json({
      success: true,
      queue,
      waitingCount,
      currentlyServing,
      estimatedWaitingTime:
        waitingCount *
        queue.averageServiceTime
    });
  } catch (error) {
    console.error(
      "Get Queue Details Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch queue details"
    });
  }
};

// ==========================================
// GET MY QUEUE HISTORY (USER)
// ==========================================

export const getMyQueueHistory = async (req, res) => {
  try {
    const entries = await QueueEntry.find({
      user: req.user._id,
      status: {
        $in: ["completed", "cancelled"]
      }
    })
      .populate(
        "queue",
        "name description averageServiceTime"
      )
      .sort({ updatedAt: -1 });

    const history = entries.map((entry) => {
      let waitingTime = null;
      let serviceDuration = null;

      if (entry.joinedAt && entry.servedAt) {
        waitingTime = Math.max(
          0,
          Math.round(
            (new Date(entry.servedAt) -
              new Date(entry.joinedAt)) /
              60000
          )
        );
      }

      if (
        entry.servedAt &&
        entry.completedAt
      ) {
        serviceDuration = Math.max(
          0,
          Math.round(
            (new Date(entry.completedAt) -
              new Date(entry.servedAt)) /
              60000
          )
        );
      }

      return {
        _id: entry._id,
        queue: entry.queue,
        tokenNumber: entry.tokenNumber,
        status: entry.status,
        joinedAt: entry.joinedAt,
        servedAt: entry.servedAt,
        completedAt: entry.completedAt,
        waitingTime,
        serviceDuration
      };
    });

    return res.status(200).json({
      success: true,
      total: history.length,
      entries: history
    });
  } catch (error) {
    console.error(
      "Get Queue History Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch queue history"
    });
  }
};

// ==========================================
// UPDATE QUEUE STATUS (ADMIN)
// PAUSE / RESUME / CLOSE / REOPEN
// RESPONSE AFTER LOCK RELEASE
// ==========================================

export const updateQueueStatus = async (req, res) => {
  const { queueId } = req.params;
  const { status } = req.body;

  if (!mongoose.isValidObjectId(queueId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid queue ID"
    });
  }

  const allowedStatuses = [
    "active",
    "paused",
    "closed"
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid queue status"
    });
  }

  try {
    const result = await withQueueLock(
      queueId,
      async () => {
        const queue = await Queue.findById(queueId);

        if (!queue) {
          return errorResult(
            404,
            "Queue not found"
          );
        }

        if (
          queue.createdBy.toString() !==
          req.user._id.toString()
        ) {
          return errorResult(
            403,
            "You cannot manage this queue"
          );
        }

        if (queue.status === status) {
          return errorResult(
            400,
            `Queue is already ${status}`
          );
        }

        const validTransitions = {
          active: ["paused", "closed"],
          paused: ["active", "closed"],
          closed: ["active"]
        };

        const currentStatus = queue.status;

        if (
          !validTransitions[currentStatus]?.includes(
            status
          )
        ) {
          return errorResult(
            400,
            `Cannot change queue status from ${currentStatus} to ${status}`
          );
        }

        if (status === "closed") {
          const activeEntries =
            await QueueEntry.countDocuments({
              queue: queueId,
              status: {
                $in: ACTIVE_ENTRY_STATUSES
              }
            });

          if (activeEntries > 0) {
            return errorResult(
              409,
              "Cannot close queue while customers are waiting or being served"
            );
          }
        }

        queue.status = status;

        await queue.save();

        let message = "";

        if (
          currentStatus === "closed" &&
          status === "active"
        ) {
          message =
            "Queue reopened successfully";
        } else if (status === "paused") {
          message =
            "Queue paused successfully";
        } else if (status === "active") {
          message =
            "Queue resumed successfully";
        } else if (status === "closed") {
          message =
            "Queue closed successfully";
        }

        return responseResult(200, {
          success: true,
          message,
          queue
        });
      }
    );

    if (result.status === 200) {
      emitQueueUpdate(queueId);
    }

    return sendResult(res, result);
  } catch (error) {
    console.error(
      "Update Queue Status Error:",
      error
    );

    return handleQueueOperationError(
      res,
      error,
      "Failed to update queue status"
    );
  }
};