import { body } from "express-validator";

// ==========================================
// REGISTRATION VALIDATION
// ==========================================

export const registerValidation = [
  body("name")
    .isString()
    .withMessage("Name must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Name is required.")
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Name must contain 2 to 100 characters."
    ),

  body("email")
    .isString()
    .withMessage("Email must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .bail()
    .isEmail()
    .withMessage("Enter a valid email address.")
    .bail()
    .isLength({
      max: 254,
    })
    .withMessage("Email is too long.")
    .customSanitizer((value) =>
      value.toLowerCase()
    ),

  body("password")
    .isString()
    .withMessage("Password must be a string.")
    .bail()
    .isLength({
      min: 8,
      max: 72,
    })
    .withMessage(
      "Password must contain 8 to 72 characters."
    ),
];

// ==========================================
// LOGIN VALIDATION
// ==========================================

export const loginValidation = [
  body("email")
    .isString()
    .withMessage("Email must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .bail()
    .isEmail()
    .withMessage("Enter a valid email address.")
    .bail()
    .isLength({
      max: 254,
    })
    .withMessage("Email is too long.")
    .customSanitizer((value) =>
      value.toLowerCase()
    ),

  body("password")
    .isString()
    .withMessage("Password must be a string.")
    .bail()
    .notEmpty()
    .withMessage("Password is required."),
];