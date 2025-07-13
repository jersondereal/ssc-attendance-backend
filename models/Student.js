const db = require("../config/database");

class Student {
  static async findAll() {
    const query = "SELECT * FROM students ORDER BY student_id";
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(studentId) {
    const query = "SELECT * FROM students WHERE student_id = $1";
    const result = await db.query(query, [studentId]);
    return result.rows[0];
  }

  static async create(studentData) {
    const { student_id, name, course, year, section, rfid } = studentData;
    const query = `
      INSERT INTO students (student_id, name, course, year, section, rfid)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await db.query(query, [
      student_id,
      name,
      course,
      year,
      section,
      rfid,
    ]);
    return result.rows[0];
  }

  static async update(studentId, studentData) {
    const { name, course, year, section, rfid } = studentData;
    const query = `
      UPDATE students 
      SET name = $1, course = $2, year = $3, section = $4, rfid = $5
      WHERE student_id = $6
      RETURNING *
    `;
    const result = await db.query(query, [
      name,
      course,
      year,
      section,
      rfid,
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

  static async findByCourse(course) {
    const query =
      "SELECT * FROM students WHERE course = $1 ORDER BY student_id";
    const result = await db.query(query, [course]);
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
      ORDER BY e.event_date DESC
    `;
    const result = await db.query(query, [studentId]);
    return result.rows;
  }
}

module.exports = Student;
