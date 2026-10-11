const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/database");

const router = express.Router();

// ============================================================
// POST /auth/login
// ============================================================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Validate request body
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      error: "email and password are required"
    });
  }

  // JWT secret must be configured
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured");

    return res.status(500).json({
      error: "Authentication configuration error"
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Find user by email
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        password,
        role
      FROM users
      WHERE email = $1;
      `,
      [normalizedEmail]
    );

    // Do not reveal whether the email exists
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    // Compare supplied password with bcrypt hash
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    // Validate role before putting it into the JWT
    if (user.role !== "user" && user.role !== "admin") {
      console.error(
        `Invalid role for user ${user.id}: ${user.role}`
      );

      return res.status(500).json({
        error: "Invalid user role"
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h"
      }
    );

    // Login successful
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      error: "Login failed"
    });
  }
});

module.exports = router;
