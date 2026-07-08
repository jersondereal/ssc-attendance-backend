const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");

// Import routes
const userRoutes = require("./routes/userRoutes");
const studentRoutes = require("./routes/studentRoutes");
const eventRoutes = require("./routes/eventRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const finesRoutes = require("./routes/finesRoutes");
const overviewRoutes = require("./routes/overviewRoutes");
const collegeRoutes = require("./routes/collegeRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { startAttendanceHistoryCleanup } = require("./utils/attendanceHistoryCleanup");

// Load environment variables
dotenv.config({ path: ".env.local" });

const app = express();

// Render (and most PaaS) put the app behind a single reverse proxy. Trust
// exactly one hop so req.ip reflects the real client IP (from X-Forwarded-For)
// — required for express-rate-limit to key per-user instead of lumping every
// visitor under the proxy's IP. Use 1, not `true`, so the header can't be
// spoofed to bypass the limiter.
app.set("trust proxy", 1);

const allowedOrigins = [
  "https://essu-ssc.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  ...(process.env.ADDITIONAL_CORS_ORIGINS
    ? process.env.ADDITIONAL_CORS_ORIGINS.split(",")
    : []),
];

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fines", finesRoutes);
app.use("/api/overview", overviewRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/ai", aiRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to SSC Attendance API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startAttendanceHistoryCleanup();
});
