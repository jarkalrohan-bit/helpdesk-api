const express = require("express");
const pool = require("../db/database");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

function isValidId(id) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

function canAccessTicket(ticket, user) {
  return (
    user.role === "admin" ||
    String(ticket.user_id) === String(user.userId)
  );
}

// ============================================================
// POST /tickets/:id/comments
// Create a comment on a ticket
// ============================================================
router.post("/:id/comments", authMiddleware, async (req, res) => {
  const { id: ticketId } = req.params;
  const { content } = req.body;

  if (!isValidId(ticketId)) {
    return res.status(400).json({
      error: "Invalid ticket ID"
    });
  }

  if (
    typeof content !== "string" ||
    !content.trim()
  ) {
    return res.status(400).json({
      error: "content is required"
    });
  }

  try {
    const ticketResult = await pool.query(
      `SELECT id, user_id FROM tickets WHERE id = $1`,
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        error: "Ticket not found"
      });
    }

    const ticket = ticketResult.rows[0];

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({
        error: "You cannot comment on this ticket"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO comments (ticket_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING
        id,
        ticket_id,
        user_id,
        content,
        created_at,
        updated_at;
      `,
      [ticketId, req.user.userId, content.trim()]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating comment:", error.message);

    if (error.code === "23503") {
      return res.status(404).json({
        error: "User or ticket not found"
      });
    }

    return res.status(500).json({
      error: "Failed to create comment"
    });
  }
});

// ============================================================
// GET /tickets/:id/comments
// Retrieve the ticket conversation
// ============================================================
router.get("/:id/comments", authMiddleware, async (req, res) => {
  const { id: ticketId } = req.params;

  if (!isValidId(ticketId)) {
    return res.status(400).json({
      error: "Invalid ticket ID"
    });
  }

  try {
    const ticketResult = await pool.query(
      `SELECT id, user_id FROM tickets WHERE id = $1`,
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        error: "Ticket not found"
      });
    }

    if (!canAccessTicket(ticketResult.rows[0], req.user)) {
      return res.status(403).json({
        error: "You cannot view comments for this ticket"
      });
    }

    const result = await pool.query(
      `
      SELECT
        comments.id,
        comments.ticket_id,
        comments.user_id,
        users.name AS author_name,
        comments.content,
        comments.created_at,
        comments.updated_at
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.ticket_id = $1
      ORDER BY comments.created_at ASC, comments.id ASC;
      `,
      [ticketId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching comments:", error.message);

    return res.status(500).json({
      error: "Failed to fetch comments"
    });
  }
});

// ============================================================
// PATCH /comments/:id
// Edit your own comment; admins can edit any comment
// ============================================================
router.patch("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!isValidId(id)) {
    return res.status(400).json({
      error: "Invalid comment ID"
    });
  }

  if (
    typeof content !== "string" ||
    !content.trim()
  ) {
    return res.status(400).json({
      error: "content is required"
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE comments
      SET
        content = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
        AND ($3 = 'admin' OR user_id = $4)
      RETURNING
        id,
        ticket_id,
        user_id,
        content,
        created_at,
        updated_at;
      `,
      [content.trim(), id, req.user.role, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Comment not found"
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating comment:", error.message);

    return res.status(500).json({
      error: "Failed to update comment"
    });
  }
});

// ============================================================
// DELETE /comments/:id
// Delete your own comment; admins can delete any comment
// ============================================================
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({
      error: "Invalid comment ID"
    });
  }

  try {
    const result = await pool.query(
      `
      DELETE FROM comments
      WHERE id = $1
        AND ($2 = 'admin' OR user_id = $3)
      RETURNING
        id,
        ticket_id,
        user_id,
        content,
        created_at,
        updated_at;
      `,
      [id, req.user.role, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Comment not found"
      });
    }

    return res.status(200).json({
      message: "Comment deleted successfully",
      comment: result.rows[0]
    });
  } catch (error) {
    console.error("Error deleting comment:", error.message);

    return res.status(500).json({
      error: "Failed to delete comment"
    });
  }
});

module.exports = router;