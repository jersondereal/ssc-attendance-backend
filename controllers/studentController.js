const Student = require("../models/Student");
const College = require("../models/College");
const Attendance = require("../models/Attendance");

// Students sometimes type their ID without the dash (e.g. "26001274" instead
// of "26-001274"), which fails the valid_student_id format check. If the ID is
// all digits with no dash, insert one after the first 2 (year) digits so it
// still saves. Values that already contain a dash (or aren't all digits) are
// left untouched — the format check still guards those.
const normalizeStudentId = (rawId) => {
  if (typeof rawId !== "string") return rawId;
  const trimmed = rawId.trim();
  if (/^\d+$/.test(trimmed) && trimmed.length > 2) {
    return `${trimmed.slice(0, 2)}-${trimmed.slice(2)}`;
  }
  return trimmed;
};

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
    student_id: normalizeStudentId(body?.student_id),
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

// Translate a Postgres error into a descriptive, user-facing message.
// Codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
const describeStudentDbError = (error) => {
  switch (error?.code) {
    case "23505": // unique_violation
      if (
        error.constraint === "students_student_id_key" ||
        error.constraint === "students_pkey"
      ) {
        return { status: 409, message: "A student with this student ID already exists." };
      }
      if (error.constraint === "students_rfid_key") {
        return { status: 409, message: "This RFID is already assigned to another student." };
      }
      return {
        status: 409,
        message: error.detail || "A student with these details already exists.",
      };
    case "23514": // check_violation
      if (error.constraint === "valid_student_id") {
        return {
          status: 400,
          message: "Student ID must start with a 2-digit year followed by a dash (e.g. 21-0001).",
        };
      }
      return { status: 400, message: error.detail || "A field failed a validation rule." };
    case "23502": // not_null_violation
      return { status: 400, message: `${error.column || "A required field"} is required.` };
    case "22001": // string_data_right_truncation
      return { status: 400, message: "One of the fields is longer than allowed." };
    default:
      return { status: 500, message: error?.message || "Something went wrong." };
  }
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
        .json({ message: "Error fetching students" });
    }
  },

  async getStudentsPaginated(req, res) {
    try {
      const { page = 1, limit = 50, search = "", college = "all", year = "all", section = "all", sortKey = "student_id", sortDir = "asc" } = req.query;
      const { rows, total } = await Student.findPaginated({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        search,
        college,
        year,
        section,
        sortKey,
        sortDir,
      });
      res.json({ data: rows.map(formatStudentResponse), total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
    } catch (error) {
      res.status(500).json({ message: "Error fetching students" });
    }
  },

  async getStudentIds(req, res) {
    try {
      const { search = "", college = "all", year = "all", section = "all" } = req.query;
      const ids = await Student.findAllIds({ search, college, year, section });
      res.json({ ids });
    } catch (error) {
      res.status(500).json({ message: "Error fetching student IDs" });
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
        .json({ message: "Error fetching student" });
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
      // If the entered ID (or one of its " (n)" duplicate variants) already
      // belongs to a student with the SAME name, this is the same person
      // re-registering — don't create another duplicate row, just tell them
      // they're already registered.
      const existing = await Student.findByBaseId(input.student_id);
      if (existing.length > 0) {
        const normalizeName = (n) =>
          (n ?? "").trim().replace(/\s+/g, " ").toLowerCase();
        const incomingName = normalizeName(input.name);
        const alreadyRegistered = existing.some(
          (s) => normalizeName(s.name) === incomingName
        );
        if (alreadyRegistered) {
          return res.status(409).json({
            alreadyRegistered: true,
            message: "This student is already registered.",
          });
        }
      }

      // Self-service registration opts into the duplicate-ID fallback so a
      // student whose ID is already taken still gets registered (with a
      // " (n)"-suffixed ID) instead of hitting an error. Admin-side adds omit
      // the flag, so they still get the normal "already exists" error.
      const student = await Student.create(input, {
        duplicateFallback: req.body?.allow_duplicate_fallback === true,
      });

      console.log(
        `[register] Student registered: ${student.student_id} - ${student.name} (${student.college}, ${student.year}-${student.section}) at ${new Date().toISOString()}`
      );

      // Enroll the new student into all present/upcoming events so they show
      // up in those events' attendance. Best-effort: registration itself has
      // already succeeded, so a failure here shouldn't fail the request.
      try {
        await Attendance.createForStudentInCurrentAndUpcomingEvents(
          student.student_id
        );
      } catch (enrollError) {
        console.error(
          "Failed to enroll new student in upcoming events:",
          enrollError
        );
      }

      res.status(201).json(formatStudentResponse(student));
    } catch (error) {
      console.error(error);
      const { status, message } = describeStudentDbError(error);
      res.status(status).json({ message });
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
      const { status, message } = describeStudentDbError(error);
      res.status(status).json({ message });
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
        .json({ message: "Error deleting student" });
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

      });
    }
  },
};

module.exports = studentController;
