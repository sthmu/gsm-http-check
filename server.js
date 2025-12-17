const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const LOG_FILE = "gsm_logs.json";

// In-memory logs (Render's filesystem is ephemeral)
let logs = [];

// Try to load existing logs on startup
try {
  if (fs.existsSync(LOG_FILE)) {
    logs = JSON.parse(fs.readFileSync(LOG_FILE));
    console.log(`Loaded ${logs.length} existing logs`);
  }
} catch (err) {
  console.log("Starting with empty logs");
}

/**
 * Root endpoint for health checks
 */
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "GSM Test API is running",
    endpoints: {
      post: "/api/gsm-test",
      logs: "/api/logs"
    }
  });
});

/**
 * POST endpoint for GSM testing
 */
app.post("/api/gsm-test", (req, res) => {
  try {
    const entry = {
      receivedAt: new Date().toISOString(),
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      data: req.body
    };

    // Add to in-memory logs
    logs.push(entry);

    // Keep only last 100 entries to prevent memory issues
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }

    // Try to save to file (non-blocking)
    fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2), (err) => {
      if (err) console.error("Failed to save logs:", err.message);
    });

    console.log("GSM POST RECEIVED:", entry);

    // SUCCESS RESPONSE (Arduino will check this)
    res.status(200).json({
      status: "SUCCESS",
      serverTime: entry.receivedAt,
      totalLogs: logs.length
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      status: "ERROR",
      message: "Server error"
    });
  }
});

/**
 * Endpoint to view logs
 */
app.get("/api/logs", (req, res) => {
  res.json({
    totalLogs: logs.length,
    logs: logs
  });
});

app.listen(PORT, () => {
  console.log(`HTTP GSM Test API running on port ${PORT}`);
});
