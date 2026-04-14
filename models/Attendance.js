const db = require("../config/database");

class Attendance {
  static async findByEvent(eventId) {
    const query = `
      SELECT a.*, s.name, s.student_id, s.college, s.year, s.section, s.student_id
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      WHERE a.event_id = $1
      ORDER BY s.name
    `;
    const result = await db.query(query, [eventId]);
    return result.rows;
  }

  static async findByEventPaginated(eventId, { page = 1, limit = 50, search = "", college = "all", year = "all", section = "all", status = "all", sortKey = "name", sortDir = "asc" } = {}) {
    const validSortKeys = ["name", "student_id", "college", "year", "section", "status"];
    const safeSortKey = validSortKeys.includes(sortKey) ? `s.${sortKey}` : "s.name";
    const safeSortDir = sortDir === "desc" ? "DESC" : "ASC";
    const offset = (page - 1) * limit;

    const conditions = ["a.event_id = $1"];
    const params = [eventId];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(s.name) LIKE $${params.length} OR LOWER(s.student_id) LIKE $${params.length} OR LOWER(s.college) LIKE $${params.length})`);
    }
    if (college !== "all") {
      params.push(college.toLowerCase());
      conditions.push(`LOWER(s.college) = $${params.length}`);
    }
    if (year !== "all") {
      params.push(year);
      conditions.push(`s.year = $${params.length}`);
    }
    if (section !== "all") {
      params.push(section.toLowerCase());
      conditions.push(`LOWER(s.section) = $${params.length}`);
    }
    if (status !== "all") {
      params.push(status);
      conditions.push(`a.status = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const countResult = await db.query(
      `SELECT COUNT(*) FROM attendance a JOIN students s ON a.student_id = s.student_id ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const dataResult = await db.query(
      `SELECT a.*, s.name, s.student_id, s.college, s.year, s.section
       FROM attendance a JOIN students s ON a.student_id = s.student_id
       ${where} ORDER BY ${safeSortKey} ${safeSortDir} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return { rows: dataResult.rows, total };
  }

  static async findByStudent(studentId) {
    const query = `
      SELECT a.*, e.title, e.event_date, e.location
      FROM attendance a
      JOIN events e ON a.event_id = e.id
      WHERE a.student_id = $1
      ORDER BY e.event_date DESC
    `;
    const result = await db.query(query, [studentId]);
    return result.rows;
  }

  static async updateStatus(studentId, eventId, status) {
    const query = `
      UPDATE attendance 
      SET status = $1, check_in_time = CURRENT_TIMESTAMP
      WHERE student_id = $2 AND event_id = $3
      RETURNING *
    `;
    const result = await db.query(query, [status, studentId, eventId]);
    return result.rows[0];
  }

  static async createBulk(eventId, studentIds) {
    const values = studentIds
      .map(
        (studentId) =>
          `('${studentId}', ${eventId}, 'Absent', CURRENT_TIMESTAMP)`
      )
      .join(",");

    const query = `
      INSERT INTO attendance (student_id, event_id, status, check_in_time)
      VALUES ${values}
      ON CONFLICT (student_id, event_id) DO NOTHING
      RETURNING *
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async getAttendanceStats(eventId) {
    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM attendance
      WHERE event_id = $1
      GROUP BY status
    `;
    const result = await db.query(query, [eventId]);
    return result.rows;
  }

  static async getStudentFines(studentId) {
    const query = `
      SELECT 
        a.id,
        a.student_id,
        a.event_id,
        a.status,
        a.is_paid,
        e.title as event_title,
        e.event_date,
        e.fine as amount
      FROM attendance a
      JOIN events e ON a.event_id = e.id
      WHERE a.student_id = $1 AND a.status = 'Absent'
      ORDER BY e.event_date DESC
    `;
    const result = await db.query(query, [studentId]);
    return result.rows;
  }

  static async updateFineStatus(studentId, eventId, isPaid) {
    const query = `
      UPDATE attendance 
      SET is_paid = $1
      WHERE student_id = $2 AND event_id = $3 AND status = 'Absent'
      RETURNING *
    `;
    const result = await db.query(query, [isPaid, studentId, eventId]);
    return result.rows[0];
  }

  static async getTotalUnpaidFines(studentId) {
    const query = `
      SELECT COALESCE(SUM(e.fine), 0) as total_unpaid
      FROM attendance a
      JOIN events e ON a.event_id = e.id
      WHERE a.student_id = $1 
        AND a.status = 'Absent' 
        AND a.is_paid = false
    `;
    const result = await db.query(query, [studentId]);
    return result.rows[0].total_unpaid;
  }
}

module.exports = Attendance;
