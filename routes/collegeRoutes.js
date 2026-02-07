const express = require("express");
const router = express.Router();
const collegeController = require("../controllers/collegeController");

router.get("/", collegeController.getAllColleges);
router.get("/:id", collegeController.getCollegeById);
router.post("/", collegeController.createCollege);
router.put("/:id", collegeController.updateCollege);
router.delete("/:id", collegeController.deleteCollege);

module.exports = router;
