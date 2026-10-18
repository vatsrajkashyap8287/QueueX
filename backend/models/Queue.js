import mongoose from "mongoose";

const queueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["active", "paused", "closed"],
      default: "active"
    },

    averageServiceTime: {
      type: Number,
      default: 5,
      min: 1
    },

    currentToken: {
      type: Number,
      default: 0
    },

    lastIssuedToken: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Queue = mongoose.model("Queue", queueSchema);

export default Queue;