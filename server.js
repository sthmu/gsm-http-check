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

// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, JSON.stringify([]));
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
  const entry = {
    receivedAt: new Date().toISOString(),
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    data: req.body
  };

  // Load old logs
  const logs = JSON.parse(fs.readFileSync(LOG_FILE));
  logs.push(entry);

  // Save logs
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));

  console.log("GSM POST RECEIVED:", entry);

  // SUCCESS RESPONSE (Arduino will check this)
  res.json({
    status: "SUCCESS",
    serverTime: entry.receivedAt
  });
});

/**
 * Endpoint to view logs
 */
app.get("/api/logs", (req, res) => {
  const logs = JSON.parse(fs.readFileSync(LOG_FILE));
  res.json(logs);
});

app.listen(PORT, () => {
  console.log(`HTTP GSM Test API running on port ${PORT}`);
});
