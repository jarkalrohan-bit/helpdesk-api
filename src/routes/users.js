const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db/database");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ============================================================
// POST /users
// ============================================================
// Register a new user.
//
// Public endpoint.
// Password is hashed with bcrypt before being stored.
// ============================================================
router.post("/", async (req, res) => {
  const {
    name,
    email,
    password
  } = req.body;

  // Validate name
  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    return res.status(400).json({
      error: "name is required"
    });
  }

  // Validate email
  if (
    typeof email !== "string" ||
    !email.trim()
  ) {
    return res.status(400).json({
      error: "email is required"
    });
  }

  // Validate password
  if (
    typeof password !== "string" ||
    !password
  ) {
    return res.status(400).json({
      error: "password is required"
    });
  }

  // Basic password length validation
  if (password.length < 8) {
    return res.status(400).json({
      error: "password must be at least 8 characters"
    });
  }

  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Hash password before storing it
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const result = await pool.query(
      `
      INSERT INTO users (
        name,
        email,
        password
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        name,
        email,
        role,
        created_at;
      `,
      [
        normalizedName,
        normalizedEmail,
        hashedPassword
      ]
    );

    return res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(
      "Error creating user:",
      error.message
    );

    // Duplicate email
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Email already exists"
      });
    }

    return res.status(500).json({
      error: "Failed to create user"
    });
  }
});


// ============================================================
// GET /users/:id
// ============================================================
// Authentication required.
//
// A user can view their own profile.
// An admin can view any user.
// ============================================================
router.get(
  "/:id",
  authMiddleware,
  async (req, res) => {
    const { id } = req.params;

    // Normal users can only view themselves
    if (
      req.user.role !== "admin" &&
      req.user.userId !== id
    ) {
      return res.status(403).json({
        error: "You cannot view this user"
      });
    }

    try {
      const result = await pool.query(
        `
        SELECT
          id,
          name,
          email,
          role,
          created_at
        FROM users
        WHERE id = $1;
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "User not found"
        });
      }

      return res.status(200).json(
        result.rows[0]
      );

    } catch (error) {
      console.error(
        "Error fetching user:",
        error.message
      );

      return res.status(500).json({
        error: "Failed to fetch user"
      });
    }
  }
);


module.exports = router;
