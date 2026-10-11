const express = require("express");
const pool = require("../db/database");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

const ALLOWED_PRIORITIES = [
  "low",
  "medium",
  "high",
  "urgent"
];

const ALLOWED_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed"
];

// ============================================================
// POST /tickets
// ============================================================
// Authenticated users can create tickets.
// Status is always controlled by the database/default.
// ============================================================
router.post("/", authMiddleware, async (req, res) => {
  const {
    title,
    description,
    priority
  } = req.body;

  const user_id = req.user.userId;

  // Validate title
  if (
    typeof title !== "string" ||
    !title.trim()
  ) {
    return res.status(400).json({
      error: "title is required"
    });
  }

  // Validate description if provided
  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return res.status(400).json({
      error: "description must be a string"
    });
  }

  // Validate priority if provided
  if (
    priority !== undefined &&
    priority !== null &&
    !ALLOWED_PRIORITIES.includes(priority)
  ) {
    return res.status(400).json({
      error: "Invalid priority"
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO tickets (
        title,
        description,
        priority,
        user_id
      )
      VALUES ($1, $2, COALESCE($3, 'medium'), $4)
      RETURNING
        id,
        title,
        description,
        status,
        priority,
        user_id,
        created_at,
        updated_at;
      `,
      [
        title.trim(),
        description ?? null,
        priority ?? null,
        user_id
      ]
    );

    return res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error creating ticket:", error.message);

    // Foreign-key violation
    if (error.code === "23503") {
      return res.status(404).json({
        error: "User not found"
      });
    }

    return res.status(500).json({
      error: "Failed to create ticket"
    });
  }
});


// ============================================================
// GET /tickets
// ============================================================
// Admins see all tickets.
// Normal users see only their own tickets.
// ============================================================
router.get("/", authMiddleware, async (req, res) => {
  try {
    let result;

    if (req.user.role === "admin") {
      result = await pool.query(
        `
        SELECT
          id,
          title,
          description,
          status,
          priority,
          user_id,
          created_at,
          updated_at
        FROM tickets
        ORDER BY created_at DESC;
        `
      );
    } else {
      result = await pool.query(
        `
        SELECT
          id,
          title,
          description,
          status,
          priority,
          user_id,
          created_at,
          updated_at
        FROM tickets
        WHERE user_id = $1
        ORDER BY created_at DESC;
        `,
        [req.user.userId]
      );
    }

    return res.status(200).json(result.rows);

  } catch (error) {
    console.error("Error fetching tickets:", error.message);

    return res.status(500).json({
      error: "Failed to fetch tickets"
    });
  }
});


// ============================================================
// GET /tickets/:id
// ============================================================
// Users can view their own ticket.
// Admins can view any ticket.
// ============================================================
router.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        title,
        description,
        status,
        priority,
        user_id,
        created_at,
        updated_at
      FROM tickets
      WHERE id = $1
        AND (
          $2 = 'admin'
          OR user_id = $3
        );
      `,
      [
        id,
        req.user.role,
        req.user.userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Ticket not found"
      });
    }

    return res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error("Error fetching ticket:", error.message);

    return res.status(500).json({
      error: "Failed to fetch ticket"
    });
  }
});


// ============================================================
// PATCH /tickets/:id
// ============================================================
// Users:
// - edit own title
// - edit own description
// - edit own priority
// - cannot change status
//
// Admins:
// - edit any ticket
// - can change status
// ============================================================
router.patch("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  const {
    title,
    description,
    status,
    priority
  } = req.body;

  // At least one field must be supplied
  if (
    title === undefined &&
    description === undefined &&
    status === undefined &&
    priority === undefined
  ) {
    return res.status(400).json({
      error: "At least one field is required"
    });
  }

  // ----------------------------------------------------------
  // Validate title
  // ----------------------------------------------------------
  if (
    title !== undefined &&
    (
      typeof title !== "string" ||
      !title.trim()
    )
  ) {
    return res.status(400).json({
      error: "title must be a non-empty string"
    });
  }

  // ----------------------------------------------------------
  // Validate description
  // ----------------------------------------------------------
  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return res.status(400).json({
      error: "description must be a string or null"
    });
  }

  // ----------------------------------------------------------
  // Normal users cannot change status
  // ----------------------------------------------------------
  if (
    req.user.role !== "admin" &&
    status !== undefined
  ) {
    return res.status(403).json({
      error: "Only admins can change ticket status"
    });
  }

  // ----------------------------------------------------------
  // Validate status
  // ----------------------------------------------------------
  if (
    status !== undefined &&
    !ALLOWED_STATUSES.includes(status)
  ) {
    return res.status(400).json({
      error: "Invalid status"
    });
  }

  // ----------------------------------------------------------
  // Validate priority
  // ----------------------------------------------------------
  if (
    priority !== undefined &&
    !ALLOWED_PRIORITIES.includes(priority)
  ) {
    return res.status(400).json({
      error: "Invalid priority"
    });
  }

  try {
    let result;

    // ========================================================
    // ADMIN
    // ========================================================
    if (req.user.role === "admin") {
      result = await pool.query(
        `
        UPDATE tickets
        SET
          title = CASE
            WHEN $1::boolean THEN $2
            ELSE title
          END,

          description = CASE
            WHEN $3::boolean THEN $4
            ELSE description
          END,

          status = CASE
            WHEN $5::boolean THEN $6
            ELSE status
          END,

          priority = CASE
            WHEN $7::boolean THEN $8
            ELSE priority
          END,

          updated_at = NOW()

        WHERE id = $9

        RETURNING
          id,
          title,
          description,
          status,
          priority,
          user_id,
          created_at,
          updated_at;
        `,
        [
          title !== undefined,
          title !== undefined ? title.trim() : null,

          description !== undefined,
          description !== undefined ? description : null,

          status !== undefined,
          status !== undefined ? status : null,

          priority !== undefined,
          priority !== undefined ? priority : null,

          id
        ]
      );
    }

    // ========================================================
    // NORMAL USER
    // ========================================================
    else {
      result = await pool.query(
        `
        UPDATE tickets
        SET
          title = CASE
            WHEN $1::boolean THEN $2
            ELSE title
          END,

          description = CASE
            WHEN $3::boolean THEN $4
            ELSE description
          END,

          priority = CASE
            WHEN $5::boolean THEN $6
            ELSE priority
          END,

          updated_at = NOW()

        WHERE id = $7
          AND user_id = $8

        RETURNING
          id,
          title,
          description,
          status,
          priority,
          user_id,
          created_at,
          updated_at;
        `,
        [
          title !== undefined,
          title !== undefined ? title.trim() : null,

          description !== undefined,
          description !== undefined ? description : null,

          priority !== undefined,
          priority !== undefined ? priority : null,

          id,
          req.user.userId
        ]
      );
    }

    // Ticket does not exist OR user cannot access it
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Ticket not found"
      });
    }

    return res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error("Error updating ticket:", error.message);

    return res.status(500).json({
      error: "Failed to update ticket"
    });
  }
});


// ============================================================
// DELETE /tickets/:id
// ============================================================
// Admin only.
// ============================================================
router.delete(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        `
        DELETE FROM tickets
        WHERE id = $1
        RETURNING
          id,
          title,
          status,
          priority;
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Ticket not found"
        });
      }

      return res.status(200).json({
        message: "Ticket deleted successfully",
        ticket: result.rows[0]
      });

    } catch (error) {
      console.error("Error deleting ticket:", error.message);

      return res.status(500).json({
        error: "Failed to delete ticket"
      });
    }
  }
);


module.exports = router;
