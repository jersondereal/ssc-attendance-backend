const db = require("../config/database");

class Overview {
  static async getTotalStudents() {
    const query = "SELECT COUNT(*)::int AS total FROM students";
    const result = await db.query(query);
    return result.rows[0].total;
  }

  static async getTotalEvents(startDate, endDate) {
    const query = `
      SELECT COUNT(*)::int AS total
      FROM events
      WHERE event_date >= $1 AND event_date <= $2
    `;
    const result = await db.query(query, [startDate, endDate]);
    return result.rows[0].total;
  }

  static async getAttendanceRate(startDate, endDate) {
    const query = `
      SELECT
        COALESCE(SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END), 0) AS present_count,
        COUNT(*) AS total_count
      FROM attendance a
      JOIN events e ON a.event_id = e.id
      WHERE e.event_date >= $1 AND e.event_date <= $2
    `;
    const result = await db.query(query, [startDate, endDate]);
    const present = Number(result.rows[0].present_count || 0);
    const total = Number(result.rows[0].total_count || 0);
    return total === 0 ? 0 : (present / total) * 100;
  }

  static async getFinesTotals(startDate, endDate) {
    const query = `
      SELECT
        COALESCE(SUM(CASE 
          WHEN a.status = 'Absent' AND (a.is_paid IS NULL OR a.is_paid = false)
          THEN e.fine ELSE 0 END), 0) AS total_outstanding,
        COALESCE(SUM(CASE 
          WHEN a.status = 'Absent' AND a.is_paid = true
          THEN e.fine ELSE 0 END), 0) AS total_collected
      FROM attendance a
      JOIN events e ON a.event_id = e.id
      WHERE e.event_date >= $1 AND e.event_date <= $2
    `;
    const result = await db.query(query, [startDate, endDate]);
    return {
      total_outstanding: Number(result.rows[0].total_outstanding || 0),
      total_collected: Number(result.rows[0].total_collected || 0),
    };
  }
}

module.exports = Overview;
