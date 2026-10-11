const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check whether Authorization header exists
  if (!authHeader) {
    return res.status(401).json({
      error: "Authorization header required"
    });
  }

  // Expected format:
  // Authorization: Bearer <token>
  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    return res.status(401).json({
      error: "Invalid authorization format"
    });
  }

  const token = parts[1];

  try {
    // Verify JWT signature and expiration
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Make sure required user information exists
    if (!decoded.userId || !decoded.role) {
      return res.status(401).json({
        error: "Invalid token payload"
      });
    }

    // Store authenticated user information
    // for use by protected routes
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);

    return res.status(401).json({
      error: "Invalid or expired token"
    });
  }
};

module.exports = authMiddleware;
