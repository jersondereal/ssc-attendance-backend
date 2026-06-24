const express = require("express");
const router = express.Router();
const collegeController = require("../controllers/collegeController");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

// Read — any authenticated user
router.get("/", authMiddleware, collegeController.getAllColleges);
router.get("/:id", authMiddleware, collegeController.getCollegeById);

// Write — administrator only
router.post("/", authMiddleware, roleMiddleware("administrator"), collegeController.createCollege);
router.put("/:id", authMiddleware, roleMiddleware("administrator"), collegeController.updateCollege);
router.delete("/:id", authMiddleware, roleMiddleware("administrator"), collegeController.deleteCollege);

module.exports = router;
