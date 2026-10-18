import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../models/User.js";
import Queue from "../models/Queue.js";
import QueueEntry from "../models/QueueEntry.js";

// ==========================================
// SOCKET.IO INITIALIZATION
// ==========================================

const initializeSocket = (io) => {
  // ========================================
  // JWT AUTHENTICATION MIDDLEWARE
  // ========================================

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      // ------------------------------------
      // VALIDATE TOKEN FORMAT
      // ------------------------------------

      if (
        typeof token !== "string" ||
        !token.trim()
      ) {
        return next(
          new Error("Authentication required")
        );
      }

      // ------------------------------------
      // VERIFY JWT SECRET
      // ------------------------------------

      const secret = process.env.JWT_SECRET;

      if (!secret) {
        console.error(
          "Socket authentication failed: JWT_SECRET missing"
        );

        return next(
          new Error("Authentication service unavailable")
        );
      }

      // ------------------------------------
      // VERIFY JWT SIGNATURE
      // ------------------------------------

      const decoded = jwt.verify(
        token,
        secret,
        {
          algorithms: ["HS256"],
        }
      );

      // ------------------------------------
      // VALIDATE JWT PAYLOAD
      // ------------------------------------

      if (
        !decoded ||
        typeof decoded !== "object" ||
        !mongoose.isValidObjectId(decoded.id)
      ) {
        return next(
          new Error("Invalid token payload")
        );
      }

      // ------------------------------------
      // FIND AUTHENTICATED USER
      // ------------------------------------

      const user = await User.findById(decoded.id);

      if (!user) {
        return next(
          new Error("User no longer exists")
        );
      }

      socket.user = user;

      next();

    } catch (error) {
      // ------------------------------------
      // EXPIRED TOKEN
      // ------------------------------------

      if (error.name === "TokenExpiredError") {
        return next(
          new Error(
            "Session expired. Please log in again."
          )
        );
      }

      // ------------------------------------
      // INVALID TOKEN
      // ------------------------------------

      if (error.name === "JsonWebTokenError") {
        return next(
          new Error("Invalid authentication token")
        );
      }

      // ------------------------------------
      // UNEXPECTED ERROR
      // ------------------------------------

      console.error(
        "Socket authentication error:",
        error.message
      );

      next(
        new Error("Socket authentication failed")
      );
    }
  });

  // ========================================
  // SOCKET CONNECTION
  // ========================================

  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.user.name} (${socket.id})`
    );

    // Authenticated user's private room.
    socket.join(`user:${socket.user._id}`);

    // ======================================
    // JOIN QUEUE ROOM
    // ======================================

    socket.on(
      "join_queue_room",
      async (queueId, callback) => {
        try {
          if (
            typeof queueId !== "string" ||
            !mongoose.isValidObjectId(queueId)
          ) {
            return callback?.({
              success: false,
              message: "Invalid queue ID",
            });
          }

          const queue = await Queue.findById(queueId);

          if (!queue) {
            return callback?.({
              success: false,
              message: "Queue not found",
            });
          }

          const isOwner =
            queue.createdBy.toString() ===
            socket.user._id.toString();

          const activeEntry = await QueueEntry.exists({
            queue: queueId,
            user: socket.user._id,
            status: {
              $in: ["waiting", "serving"],
            },
          });

          // Only the queue owner or active participant
          // is allowed to join the room.
          if (!isOwner && !activeEntry) {
            return callback?.({
              success: false,
              message:
                "Not authorized for this queue room",
            });
          }

          socket.join(`queue:${queueId}`);

          callback?.({
            success: true,
            message: "Joined queue room",
          });
        } catch (error) {
          console.error(
            "Queue room error:",
            error.message
          );

          callback?.({
            success: false,
            message: "Failed to join queue room",
          });
        }
      }
    );

    // ======================================
    // LEAVE QUEUE ROOM
    // ======================================

    socket.on("leave_queue_room", (queueId) => {
      if (
        typeof queueId === "string" &&
        mongoose.isValidObjectId(queueId)
      ) {
        socket.leave(`queue:${queueId}`);
      }
    });

    // ======================================
    // DISCONNECT
    // ======================================

    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.id} (${reason})`
      );
    });
  });
};

export default initializeSocket;