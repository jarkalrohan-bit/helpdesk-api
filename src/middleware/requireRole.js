const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // authMiddleware must run before requireRole
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    // Check whether the authenticated user's role
    // is allowed to access this route.
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions"
      });
    }

    next();
  };
};

module.exports = requireRole;
