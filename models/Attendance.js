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

  static async updateStatus(studentId, eventId, status, { changedBy = null, changedVia = "manual" } = {}) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const current = await client.query(
        `SELECT id, status FROM attendance WHERE student_id = $1 AND event_id = $2 FOR UPDATE`,
        [studentId, eventId]
      );
      if (current.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }
      const { id: attendanceId, status: previousStatus } = current.rows[0];

      const updated = await client.query(
        `UPDATE attendance
         SET status = $1, check_in_time = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [status, attendanceId]
      );

      await client.query(
        `INSERT INTO attendance_history
           (attendance_id, student_id, event_id, previous_status, new_status, changed_by, changed_via)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [attendanceId, studentId, eventId, previousStatus, status, changedBy, changedVia]
      );

      await client.query("COMMIT");
      return updated.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async getHistoryByEvent(eventId, limit = 20) {
    const query = `
      SELECT ah.id, ah.student_id, s.name AS student_name,
             ah.previous_status, ah.new_status, ah.changed_via, ah.changed_at
      FROM attendance_history ah
      LEFT JOIN students s ON ah.student_id = s.student_id
      WHERE ah.event_id = $1
      ORDER BY ah.changed_at DESC
      LIMIT $2
    `;
    const result = await db.query(query, [eventId, limit]);
    return result.rows;
  }

  static async createBulk(eventId, studentIds) {
    const query = `
      INSERT INTO attendance (student_id, event_id, status, check_in_time)
      SELECT unnest($1::text[]), $2::int, 'Absent', CURRENT_TIMESTAMP
      ON CONFLICT (student_id, event_id) DO NOTHING
      RETURNING *
    `;
    const result = await db.query(query, [studentIds, eventId]);
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
