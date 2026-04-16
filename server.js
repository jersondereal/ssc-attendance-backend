const express = require("express");
const cors = require("cors");
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

// Load environment variables
dotenv.config({ path: ".env.local" });

const app = express();

// Middleware
app.use(
  cors({
    origin: "*",
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
});
