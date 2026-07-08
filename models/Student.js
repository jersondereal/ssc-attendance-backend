const db = require("../config/database");

class Student {
  static async findAll() {
    const query = "SELECT * FROM students ORDER BY student_id";
    const result = await db.query(query);
    return result.rows;
  }

  static async findPaginated({ page = 1, limit = 50, search = "", college = "all", year = "all", section = "all", sortKey = "student_id", sortDir = "asc" } = {}) {
    const validSortKeys = ["student_id", "name", "college", "year", "section"];
    const safeSortKey = validSortKeys.includes(sortKey) ? sortKey : "student_id";
    const safeSortDir = sortDir === "desc" ? "DESC" : "ASC";
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(student_id) LIKE $${params.length} OR LOWER(name) LIKE $${params.length} OR LOWER(college) LIKE $${params.length})`);
    }
    if (college !== "all") {
      params.push(college.toLowerCase());
      conditions.push(`LOWER(college) = $${params.length}`);
    }
    if (year !== "all") {
      params.push(year);
      conditions.push(`year = $${params.length}`);
    }
    if (section !== "all") {
      params.push(section.toLowerCase());
      conditions.push(`LOWER(section) = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await db.query(`SELECT COUNT(*) FROM students ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const dataResult = await db.query(
      `SELECT * FROM students ${where} ORDER BY ${safeSortKey} ${safeSortDir} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return { rows: dataResult.rows, total };
  }

  static async findAllIds({ search = "", college = "all", year = "all", section = "all" } = {}) {
    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(student_id) LIKE $${params.length} OR LOWER(name) LIKE $${params.length} OR LOWER(college) LIKE $${params.length})`);
    }
    if (college !== "all") {
      params.push(college.toLowerCase());
      conditions.push(`LOWER(college) = $${params.length}`);
    }
    if (year !== "all") {
      params.push(year);
      conditions.push(`year = $${params.length}`);
    }
    if (section !== "all") {
      params.push(section.toLowerCase());
      conditions.push(`LOWER(section) = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await db.query(`SELECT student_id FROM students ${where} ORDER BY student_id`, params);
    return result.rows.map((r) => r.student_id);
  }

  static async findById(studentId) {
    const query = "SELECT * FROM students WHERE student_id = $1";
    const result = await db.query(query, [studentId]);
    return result.rows[0];
  }

  static async create(studentData) {
    const { student_id, name, year, section, rfid, profile_image_url } =
      studentData;
    const college = studentData.college ?? studentData.course;
    const query = `
      INSERT INTO students (student_id, name, college, year, section, rfid, profile_image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await db.query(query, [
      student_id,
      name,
      college,
      year,
      section,
      rfid,
      profile_image_url ?? null,
    ]);
    return result.rows[0];
  }

  // `studentId` is the ORIGINAL id used to locate the row. `studentData` may
  // carry a new `student_id` to rename to — the FKs cascade the change to
  // attendance/attendance_history on update.
  static async update(studentId, studentData) {
    const { name, year, section, rfid, profile_image_url } = studentData;
    const college = studentData.college ?? studentData.course;
    const newStudentId = studentData.student_id ?? studentId;
    const query = `
      UPDATE students
      SET student_id = $1, name = $2, college = $3, year = $4, section = $5, rfid = $6, profile_image_url = $7
      WHERE student_id = $8
      RETURNING *
    `;
    const result = await db.query(query, [
      newStudentId,
      name,
      college,
      year,
      section,
      rfid,
      profile_image_url ?? null,
      studentId,
    ]);
    return result.rows[0];
  }

  static async delete(studentId) {
    const query = "DELETE FROM students WHERE student_id = $1 RETURNING *";
    const result = await db.query(query, [studentId]);
    return result.rows[0];
  }

  static async deleteMultiple(studentIds) {
    if (!studentIds || studentIds.length === 0) {
      return [];
    }

    const placeholders = studentIds
      .map((_, index) => `$${index + 1}`)
      .join(",");
    const query = `DELETE FROM students WHERE student_id IN (${placeholders}) RETURNING *`;
    const result = await db.query(query, studentIds);
    return result.rows;
  }

  static async findByCollege(college) {
    const query =
      "SELECT * FROM students WHERE college = $1 ORDER BY student_id";
    const result = await db.query(query, [college]);
    return result.rows;
  }

  static async findByRfid(rfid) {
    const query = "SELECT * FROM students WHERE rfid = $1";
    const result = await db.query(query, [rfid]);
    return result.rows[0];
  }

  static async getAttendanceMetrics(studentId) {
    const query = `
      SELECT 
        e.id as event_id,
        e.title as event_title,
        e.event_date,
        e.location,
        a.status,
        a.check_in_time,
        a.created_at as attendance_created_at
      FROM events e
      LEFT JOIN attendance a ON e.id = a.event_id AND a.student_id = $1
      WHERE a.student_id IS NOT NULL
        AND e.event_date <= CURRENT_DATE
      ORDER BY e.event_date DESC
    `;
    const result = await db.query(query, [studentId]);
    return result.rows;
  }
}

module.exports = Student;
