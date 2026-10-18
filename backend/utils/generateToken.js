import jwt from "jsonwebtoken";

// ==========================================
// JWT TOKEN GENERATION
// ==========================================

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not configured"
    );
  }

  return jwt.sign(
    {
      id: userId.toString(),
    },
    secret,
    {
      algorithm: "HS256",
      expiresIn: "7d",
    }
  );
};

export default generateToken;