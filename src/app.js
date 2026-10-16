const express = require("express");
const cors = require("cors");

const usersRouter = require("./routes/users");
const ticketsRouter = require("./routes/tickets");
const commentsRouter = require("./routes/comments");
const authRouter = require("./routes/auth");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ============================================================
// Global middleware
// ============================================================

app.use(express.json());


// ============================================================
// API routes
// ============================================================

// Authentication
app.use("/auth", authRouter);

// Users
app.use("/users", usersRouter);

// Tickets
app.use("/tickets", ticketsRouter);

// Comments
// Used for:
// POST /tickets/:id/comments
// GET  /tickets/:id/comments
app.use("/tickets", commentsRouter);

// Used for:
// PATCH  /comments/:id
// DELETE /comments/:id
app.use("/comments", commentsRouter);


// ============================================================
// Health check
// ============================================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP"
  });
});


// ============================================================
// API root
// ============================================================

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Help Desk API is running"
  });
});


// ============================================================
// 404 handler
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});


// ============================================================
// Global error handler
// ============================================================

app.use((err, req, res, next) => {
  console.error("Unhandled application error:", err);

  res.status(500).json({
    error: "Internal server error"
  });
});


module.exports = app;
