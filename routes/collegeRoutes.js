const express = require("express");
const router = express.Router();
const collegeController = require("../controllers/collegeController");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

// Read — public (needed by the self-service /register page); no login required
router.get("/", collegeController.getAllColleges);
router.get("/:id", collegeController.getCollegeById);

// Write — administrator only
router.post("/", authMiddleware, roleMiddleware("administrator"), collegeController.createCollege);
router.put("/:id", authMiddleware, roleMiddleware("administrator"), collegeController.updateCollege);
router.delete("/:id", authMiddleware, roleMiddleware("administrator"), collegeController.deleteCollege);

module.exports = router;
