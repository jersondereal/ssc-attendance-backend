const Student = require("../models/Student");

const studentController = {
  async getAllStudents(req, res) {
    try {
      const students = await Student.findAll();
      res.json(students);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching students", error: error.message });
    }
  },

  async getStudentById(req, res) {
    try {
      const student = await Student.findById(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching student", error: error.message });
    }
  },

  async createStudent(req, res) {
    try {
      const student = await Student.create(req.body);
      res.status(201).json(student);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating student", error: error.message });
    }
  },

  async updateStudent(req, res) {
    try {
      const student = await Student.update(req.params.id, req.body);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating student", error: error.message });
    }
  },

  async deleteStudent(req, res) {
    try {
      const student = await Student.delete(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting student", error: error.message });
    }
  },

  async deleteMultipleStudents(req, res) {
    try {
      const { studentIds } = req.body;

      if (
        !studentIds ||
        !Array.isArray(studentIds) ||
        studentIds.length === 0
      ) {
        return res.status(400).json({
          message: "Please provide an array of student IDs to delete",
        });
      }

      const deletedStudents = await Student.deleteMultiple(studentIds);

      if (deletedStudents.length === 0) {
        return res.status(404).json({
          message: "No students found to delete",
        });
      }

      res.json({
        message: `Successfully deleted ${deletedStudents.length} student(s)`,
        deletedStudents: deletedStudents,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error deleting students",
        error: error.message,
      });
    }
  },

  async getStudentsByCourse(req, res) {
    try {
      const students = await Student.findByCourse(req.params.course);
      res.json(students);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching students by course",
        error: error.message,
      });
    }
  },

  async getStudentMetrics(req, res) {
    try {
      const studentId = req.params.id;

      // Check if student exists
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Get attendance records
      const attendanceRecords = await Student.getAttendanceMetrics(studentId);

      console.log(attendanceRecords);

      // Calculate metrics
      const totalEvents = attendanceRecords.length;
      const present = attendanceRecords.filter(
        (record) => record.status.toLowerCase() === "present"
      ).length;
      const absent = attendanceRecords.filter(
        (record) => record.status.toLowerCase() === "absent"
      ).length;
      const excused = attendanceRecords.filter(
        (record) => record.status.toLowerCase() === "excused"
      ).length;
      const attendanceRate =
        totalEvents > 0
          ? (((present + excused) / totalEvents) * 100).toFixed(1) + "%"
          : "0%";

      const metrics = {
        student: {
          student_id: student.student_id,
          name: student.name,
          course: student.course,
          year: student.year,
          section: student.section,
        },
        summary: {
          totalEvents,
          present,
          absent,
          excused,
          attendanceRate,
        },
        attendanceRecords,
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching student metrics",
        error: error.message,
      });
    }
  },
};

module.exports = studentController;
