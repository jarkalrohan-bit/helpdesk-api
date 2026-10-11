const express = require("express");
const pool = require("../db/database");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================================
// POST /tickets/:id/comments
// ============================================================
router.post("/:id/comments", authMiddleware, async (req, res) => {
  const { id: ticket_id } = req.params;
  const { content } = req.body;

  const user_id = req.user.userId;

  // Validate required fields
  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({
      error: "content is required"
    });
  }

  try {
    // Make sure the ticket exists
    // Also get the ticket owner
    const ticketResult = await pool.query(
      `
      SELECT
        id,
        user_id
      FROM tickets
      WHERE id = $1;
      `,
      [ticket_id]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        error: "Ticket not found"
      });
    }

    const ticket = ticketResult.rows[0];

    // Normal users can comment only on their own tickets.
    // Admins can comment on any ticket.
    if (
      req.user.role !== "admin" &&
      ticket.user_id !== user_id
    ) {
      return res.status(403).json({
        error: "You cannot comment on this ticket"
      });
    }

    // Create the comment
    const result = await pool.query(
      `
      INSERT INTO comments (
        ticket_id,
        user_id,
        content
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        ticket_id,
        user_id,
        content,
        created_at,
        updated_at;
      `,
      [
        ticket_id,
        user_id,
        content.trim()
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating comment:", error.message);

    // Foreign-key violation
    if (error.code === "23503") {
      return res.status(404).json({
        error: "User or ticket not found"
      });
    }

    res.status(500).json({
      error: "Failed to create comment"
    });
  }
});


// ============================================================
// GET /tickets/:id/comments
// ============================================================
router.get(
  "/:id/comments",
  authMiddleware,
  async (req, res) => {
    const { id: ticket_id } = req.params;

    try {
      // Make sure the ticket exists
      // Also get the ticket owner
      const ticketResult = await pool.query(
        `
        SELECT
          id,
          user_id
        FROM tickets
        WHERE id = $1;
        `,
        [ticket_id]
      );

      if (ticketResult.rows.length === 0) {
        return res.status(404).json({
          error: "Ticket not found"
        });
      }

      const ticket = ticketResult.rows[0];

      // Normal users can view comments only on their own tickets.
      // Admins can view comments on any ticket.
      if (
        req.user.role !== "admin" &&
        ticket.user_id !== req.user.userId
      ) {
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
        JOIN users
          ON comments.user_id = users.id
        WHERE comments.ticket_id = $1
        ORDER BY comments.created_at ASC;
        `,
        [ticket_id]
      );

      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching comments:", error.message);

      res.status(500).json({
        error: "Failed to fetch comments"
      });
    }
  }
);


// ============================================================
// PATCH /comments/:id
// ============================================================
router.patch("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  // Validate content
  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({
      error: "content is required"
    });
  }

  try {
    let result;

    // --------------------------------------------------------
    // ADMIN
    // Admin can edit any comment
    // --------------------------------------------------------
    if (req.user.role === "admin") {
      result = await pool.query(
        `
        UPDATE comments
        SET
          content = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING
          id,
          ticket_id,
          user_id,
          content,
          created_at,
          updated_at;
        `,
        [
          content.trim(),
          id
        ]
      );
    }

    // --------------------------------------------------------
    // NORMAL USER
    // User can edit only their own comment
    // --------------------------------------------------------
    else {
      result = await pool.query(
        `
        UPDATE comments
        SET
          content = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
          AND user_id = $3
        RETURNING
          id,
          ticket_id,
          user_id,
          content,
          created_at,
          updated_at;
        `,
        [
          content.trim(),
          id,
          req.user.userId
        ]
      );
    }

    // Comment does not exist OR user does not own it
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Comment not found"
      });
    }

    // Return updated comment
    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error("Error updating comment:", error.message);

    res.status(500).json({
      error: "Failed to update comment"
    });
  }
});


// ============================================================
// DELETE /comments/:id
// ============================================================
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    let result;

    // --------------------------------------------------------
    // ADMIN
    // Admin can delete any comment
    // --------------------------------------------------------
    if (req.user.role === "admin") {
      result = await pool.query(
        `
        DELETE FROM comments
        WHERE id = $1
        RETURNING
          id,
          ticket_id,
          user_id,
          content,
          created_at,
          updated_at;
        `,
        [id]
      );
    }

    // --------------------------------------------------------
    // NORMAL USER
    // User can delete only their own comment
    // --------------------------------------------------------
    else {
      result = await pool.query(
        `
        DELETE FROM comments
        WHERE id = $1
          AND user_id = $2
        RETURNING
          id,
          ticket_id,
          user_id,
          content,
          created_at,
          updated_at;
        `,
        [
          id,
          req.user.userId
        ]
      );
    }

    // Comment does not exist OR user does not own it
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Comment not found"
      });
    }

    res.status(200).json({
      message: "Comment deleted successfully",
      comment: result.rows[0]
    });

  } catch (error) {
    console.error("Error deleting comment:", error.message);

    res.status(500).json({
      error: "Failed to delete comment"
    });
  }
});


module.exports = router;
