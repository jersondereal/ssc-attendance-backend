const Student = require("../models/Student");
const College = require("../models/College");

const normalizeStudentInput = (body) => {
  const rawRfid = body?.rfid;
  const trimmedRfid = typeof rawRfid === "string" ? rawRfid.trim() : rawRfid;
  const rawProfileUrl = body?.profile_image_url;
  const trimmedProfileUrl =
    typeof rawProfileUrl === "string" ? rawProfileUrl.trim() : rawProfileUrl;

  // Capitalize student name
  const rawName = body?.name;
  const capitalizeName = (name) => {
    if (typeof name !== "string") return name;
    return name
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(" ");
  };
  const capitalizedName = capitalizeName(rawName);

  return {
    ...body,
    name: capitalizedName,
    college: body.college ?? body.course,
    rfid: trimmedRfid ? trimmedRfid : null,
    profile_image_url:
      rawProfileUrl === undefined
        ? undefined
        : trimmedProfileUrl
        ? trimmedProfileUrl
        : null,
  };
};

const formatStudentResponse = (student) => {
  if (!student) return student;
  const college = student.college ?? student.course;
  return {
    ...student,
    college,
    course: college,
  };
};

const studentController = {
  async getAllStudents(req, res) {
    try {
      const students = await Student.findAll();
      res.json(students.map(formatStudentResponse));
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
      res.json(formatStudentResponse(student));
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching student", error: error.message });
    }
  },

  async createStudent(req, res) {
    try {
      const input = normalizeStudentInput(req.body);
      const collegeCode = input.college?.toLowerCase?.()?.trim?.();
      if (collegeCode) {
        const college = await College.findByCode(collegeCode);
        if (!college) {
          return res.status(400).json({ message: "Invalid college code" });
        }
      }
      const student = await Student.create(input);
      res.status(201).json(formatStudentResponse(student));
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Error creating student", error: error.message });
    }
  },

  async updateStudent(req, res) {
    try {
      const input = normalizeStudentInput(req.body);
      const collegeCode = input.college?.toLowerCase?.()?.trim?.();
      if (collegeCode) {
        const college = await College.findByCode(collegeCode);
        if (!college) {
          return res.status(400).json({ message: "Invalid college code" });
        }
      }
      const student = await Student.update(req.params.id, input);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(formatStudentResponse(student));
    } catch (error) {
      console.error(error);
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

  async getStudentsByCollege(req, res) {
    try {
      const students = await Student.findByCollege(req.params.college);
      res.json(students.map(formatStudentResponse));
    } catch (error) {
      res.status(500).json({
        message: "Error fetching students by college",
        error: error.message,
      });
    }
  },

  async getStudentsByCourse(req, res) {
    try {
      const students = await Student.findByCollege(req.params.course);
      res.json(students.map(formatStudentResponse));
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
          college: student.college ?? student.course,
          course: student.college ?? student.course,
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
