const express = require("express");
const overviewController = require("../controllers/overviewController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/students", authMiddleware, overviewController.getStudentStats);
router.get("/events", authMiddleware, overviewController.getEventStats);
router.get("/attendance", authMiddleware, overviewController.getAttendanceStats);
router.get("/fines", authMiddleware, overviewController.getFinesStats);

module.exports = router;
