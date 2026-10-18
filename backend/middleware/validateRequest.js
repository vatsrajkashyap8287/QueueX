import { validationResult } from "express-validator";

const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((error) => ({
    field: error.path || "unknown",
    message: error.msg,
  }));

  return res.status(400).json({
    success: false,
    message: "Validation failed.",
    errors,
  });
};

export default validateRequest;