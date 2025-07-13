const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");

// Get all students
router.get("/", studentController.getAllStudents);

// Get students by course
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
