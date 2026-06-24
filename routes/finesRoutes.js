const express = require("express");
const router = express.Router();
const finesController = require("../controllers/finesController");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

const STAFF = ["administrator", "moderator", "president", "vice_president"];

// Read — any authenticated user
router.get("/student/:studentId", authMiddleware, finesController.getStudentFines);
router.get("/student/:studentId/total", authMiddleware, finesController.getTotalUnpaidFines);

// Write — staff only
router.put("/student/:studentId/event/:eventId", authMiddleware, roleMiddleware(...STAFF), finesController.updateFineStatus);

module.exports = router;
