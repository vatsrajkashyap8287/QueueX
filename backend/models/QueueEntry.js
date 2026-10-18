import mongoose from "mongoose";

const queueEntrySchema = new mongoose.Schema(
  {
    queue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Queue",
      required: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    tokenNumber: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: [
        "waiting",
        "serving",
        "completed",
        "cancelled"
      ],
      default: "waiting"
    },

    joinedAt: {
      type: Date,
      default: Date.now
    },

    servedAt: Date,

    completedAt: Date
  },
  { timestamps: true }
);

// ==========================================
// ONE TOKEN NUMBER PER QUEUE
// ==========================================

queueEntrySchema.index(
  {
    queue: 1,
    tokenNumber: 1
  },
  {
    unique: true
  }
);

// ==========================================
// ONE ACTIVE ENTRY PER USER PER QUEUE
// ==========================================

queueEntrySchema.index(
  {
    queue: 1,
    user: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: ["waiting", "serving"]
      }
    }
  }
);

// ==========================================
// ONLY ONE SERVING CUSTOMER PER QUEUE
// ==========================================

queueEntrySchema.index(
  {
    queue: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "serving"
    }
  }
);

// ==========================================
// ONE ACTIVE QUEUE PER USER (GLOBAL)
// ==========================================

queueEntrySchema.index(
  {
    user: 1
  },
  {
    unique: true,
    name: "unique_active_queue_per_user",
    partialFilterExpression: {
      status: {
        $in: ["waiting", "serving"]
      }
    }
  }
);

// ==========================================
// EXPORT MODEL
// ==========================================

const QueueEntry = mongoose.model(
  "QueueEntry",
  queueEntrySchema
);

export default QueueEntry;