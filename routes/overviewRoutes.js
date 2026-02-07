const express = require("express");
const overviewController = require("../controllers/overviewController");

const router = express.Router();

router.get("/students", overviewController.getStudentStats);
router.get("/events", overviewController.getEventStats);
router.get("/attendance", overviewController.getAttendanceStats);
router.get("/fines", overviewController.getFinesStats);

module.exports = router;
