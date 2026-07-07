/**
 * One-time backfill: enroll every existing student into all present/upcoming
 * events (status 'Absent'), so they appear in those events' attendance.
 *
 * Safe to re-run — ON CONFLICT DO NOTHING means it only adds the rows that are
 * missing. Past events (event_date < CURRENT_DATE) are intentionally skipped.
 *
 * Run from the backend directory:  node scripts/backfill-upcoming-attendance.js
 */
const db = require("../config/database");

async function main() {
  // Context + dry-run preview
  const stats = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM students) AS student_count,
      (SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE) AS upcoming_event_count,
      (
        SELECT COUNT(*)
        FROM students s
        CROSS JOIN events e
        WHERE e.event_date >= CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1 FROM attendance a
            WHERE a.student_id = s.student_id AND a.event_id = e.id
          )
      ) AS missing_rows
  `);

  const { student_count, upcoming_event_count, missing_rows } = stats.rows[0];
  console.log(`Students:                 ${student_count}`);
  console.log(`Present/upcoming events:  ${upcoming_event_count}`);
  console.log(`Missing attendance rows:  ${missing_rows}`);

  if (Number(missing_rows) === 0) {
    console.log("Nothing to backfill. Everyone is already enrolled.");
    return;
  }

  const result = await db.query(`
    INSERT INTO attendance (student_id, event_id, status, check_in_time)
    SELECT s.student_id, e.id, 'Absent', CURRENT_TIMESTAMP
    FROM students s
    CROSS JOIN events e
    WHERE e.event_date >= CURRENT_DATE
    ON CONFLICT (student_id, event_id) DO NOTHING
  `);

  console.log(`Inserted ${result.rowCount} attendance row(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
