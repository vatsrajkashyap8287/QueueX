import {
  body,
  param,
} from "express-validator";

// ==========================================
// CREATE QUEUE VALIDATION
// ==========================================

export const createQueueValidation = [
  body("name")
    .isString()
    .withMessage("Queue name must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Queue name is required.")
    .bail()
    .isLength({
      min: 3,
      max: 100,
    })
    .withMessage(
      "Queue name must contain 3 to 100 characters."
    ),

  body("description")
    .optional({
      values: "null",
    })
    .isString()
    .withMessage("Description must be a string.")
    .bail()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "Description cannot exceed 500 characters."
    ),

  body("averageServiceTime")
    .optional()
    .isInt({
      min: 1,
      max: 1440,
    })
    .withMessage(
      "Average service time must be a whole number between 1 and 1440 minutes."
    )
    .toInt(),
];

// ==========================================
// QUEUE ID VALIDATION
// ==========================================

export const queueIdValidation = [
  param("queueId")
    .isMongoId()
    .withMessage("Invalid queue ID."),
];

// ==========================================
// QUEUE ENTRY ID VALIDATION
// ==========================================

export const entryIdValidation = [
  param("entryId")
    .isMongoId()
    .withMessage("Invalid queue entry ID."),
];

// ==========================================
// UPDATE QUEUE STATUS VALIDATION
// ==========================================

export const updateQueueStatusValidation = [
  param("queueId")
    .isMongoId()
    .withMessage("Invalid queue ID."),

  body("status")
    .isString()
    .withMessage("Queue status must be a string.")
    .bail()
    .isIn([
      "active",
      "paused",
      "closed",
    ])
    .withMessage(
      "Queue status must be active, paused, or closed."
    ),
];