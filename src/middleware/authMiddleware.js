const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Authorization header required"
    });
  }

  const parts = authHeader.trim().split(/\s+/);

  if (
    parts.length !== 2 ||
    parts[0].toLowerCase() !== "bearer" ||
    !parts[1]
  ) {
    return res.status(401).json({
      error: "Invalid authorization format"
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured");

    return res.status(500).json({
      error: "Authentication configuration error"
    });
  }

  try {
    const decoded = jwt.verify(
      parts[1],
      process.env.JWT_SECRET
    );

    if (
      decoded.userId === undefined ||
      decoded.userId === null ||
      !decoded.role
    ) {
      return res.status(401).json({
        error: "Invalid token payload"
      });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired. Please log in again."
      });
    }

    return res.status(401).json({
      error: "Invalid token. Please log in again."
    });
  }
};

module.exports = authMiddleware;