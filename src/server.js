require("dotenv").config();

const app = require("./app");
const pool = require("./db/database");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection before starting the API
    await pool.query("SELECT 1");

    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Help Desk API running on port ${PORT}`);
    });
  } catch (error) {
    console.error(
      "Database connection failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();
