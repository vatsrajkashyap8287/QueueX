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

// One token number per queue
queueEntrySchema.index(
  { queue: 1, tokenNumber: 1 },
  { unique: true }
);

// One active entry per user per queue
queueEntrySchema.index(
  { queue: 1, user: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["waiting", "serving"] }
    }
  }
);

// Only one serving customer per queue
queueEntrySchema.index(
  { queue: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "serving"
    }
  }
);

const QueueEntry = mongoose.model(
  "QueueEntry",
  queueEntrySchema
);

export default QueueEntry;