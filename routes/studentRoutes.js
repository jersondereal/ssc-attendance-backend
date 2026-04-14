const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");

// Get all students
router.get("/", studentController.getAllStudents);

// Get paginated students with filters/search/sort
router.get("/paginated", studentController.getStudentsPaginated);

// Get all student IDs matching filters (for select all)
router.get("/ids", studentController.getStudentIds);

// Get students by college
router.get("/college/:college", studentController.getStudentsByCollege);
// Backward compatibility: Get students by course
router.get("/course/:course", studentController.getStudentsByCourse);

// Get student attendance metrics
router.get("/:id/metrics", studentController.getStudentMetrics);

// Get single student
router.get("/:id", studentController.getStudentById);

// Create student
router.post("/", studentController.createStudent);

// Update student
router.put("/:id", studentController.updateStudent);

// Delete multiple students
router.delete("/bulk", studentController.deleteMultipleStudents);

// Delete student
router.delete("/:id", studentController.deleteStudent);

module.exports = router;
