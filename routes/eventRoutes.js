const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

const STAFF = ["administrator", "moderator", "president", "vice_president"];

// Read — any authenticated user
router.get("/", authMiddleware, eventController.getAllEvents);
router.get("/date/:date", authMiddleware, eventController.getEventsByDate);
router.get("/:id", authMiddleware, eventController.getEventById);

// Write — staff only
router.post("/", authMiddleware, roleMiddleware(...STAFF), eventController.createEvent);
router.put("/:id", authMiddleware, roleMiddleware(...STAFF), eventController.updateEvent);
router.delete("/:id", authMiddleware, roleMiddleware("administrator", "moderator"), eventController.deleteEvent);

module.exports = router;
