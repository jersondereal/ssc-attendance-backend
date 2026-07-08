/**
 * Migration: widen the student_id columns from VARCHAR(10) to VARCHAR(20).
 *
 * The valid_student_id CHECK allows YY- followed by up to 10 digits (e.g.
 * 00-0000000000 = 13 chars), which overflowed the old VARCHAR(10). Widen the
 * parent column and both FK child columns (they must stay the same type) to
 * VARCHAR(20) for headroom.
 *
 * Safe to re-run. Run from the backend directory:
 *   node scripts/widen-student-id-columns.js
 */
const db = require("../config/database");

async function main() {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      ALTER TABLE attendance         ALTER COLUMN student_id TYPE VARCHAR(20);
      ALTER TABLE attendance_history ALTER COLUMN student_id TYPE VARCHAR(20);
      ALTER TABLE students           ALTER COLUMN student_id TYPE VARCHAR(20);
    `);
    await client.query("COMMIT");
    console.log("Widened student_id columns to VARCHAR(20).");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
