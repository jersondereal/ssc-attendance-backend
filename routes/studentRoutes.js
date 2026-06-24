const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

// Staff roles that can write
const STAFF = ["administrator", "moderator", "president", "vice_president"];

// Public — used by self-service StudentRegistrationPage (no login required)
router.post("/", studentController.createStudent);

// Read — any authenticated user
router.get("/", authMiddleware, studentController.getAllStudents);
router.get("/paginated", authMiddleware, studentController.getStudentsPaginated);
router.get("/ids", authMiddleware, studentController.getStudentIds);
router.get("/college/:college", authMiddleware, studentController.getStudentsByCollege);
router.get("/course/:course", authMiddleware, studentController.getStudentsByCourse);
router.get("/:id/metrics", authMiddleware, studentController.getStudentMetrics);
router.get("/:id", authMiddleware, studentController.getStudentById);

// Write — staff only
router.put("/:id", authMiddleware, roleMiddleware(...STAFF), studentController.updateStudent);

// Delete — administrator and moderator only
router.delete("/bulk", authMiddleware, roleMiddleware("administrator", "moderator"), studentController.deleteMultipleStudents);
router.delete("/:id", authMiddleware, roleMiddleware("administrator", "moderator"), studentController.deleteStudent);

module.exports = router;
