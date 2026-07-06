const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

const STAFF = ["administrator", "moderator", "president", "vice_president"];

// Read — any authenticated user
router.get("/event/:eventId", authMiddleware, attendanceController.getEventAttendance);
router.get("/event/:eventId/paginated", authMiddleware, attendanceController.getEventAttendancePaginated);
router.get("/student/:studentId", authMiddleware, attendanceController.getStudentAttendance);
router.get("/event/:eventId/stats", authMiddleware, attendanceController.getAttendanceStats);
router.get("/event/:eventId/history", authMiddleware, attendanceController.getEventAttendanceHistory);

// Write — staff only
router.put("/:studentId/:eventId", authMiddleware, roleMiddleware(...STAFF), attendanceController.updateAttendanceStatus);
router.put("/rfid/:rfid/:eventId", authMiddleware, roleMiddleware(...STAFF), attendanceController.updateAttendanceByRfid);
router.post("/event/:eventId/initialize", authMiddleware, roleMiddleware(...STAFF), attendanceController.initializeEventAttendance);

module.exports = router;
