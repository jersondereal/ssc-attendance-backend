/**
 * Migration: add ON UPDATE CASCADE to the student_id foreign keys so a
 * student's ID can be changed and the change propagates to attendance and
 * attendance_history automatically.
 *
 * Both FKs keep ON DELETE CASCADE; we only add ON UPDATE CASCADE.
 * Safe to re-run.
 *
 * Run from the backend directory:
 *   node scripts/add-student-id-on-update-cascade.js
 */
const db = require("../config/database");

async function main() {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      ALTER TABLE attendance
        DROP CONSTRAINT IF EXISTS attendance_student_id_fkey;
      ALTER TABLE attendance
        ADD CONSTRAINT attendance_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE;

      ALTER TABLE attendance_history
        DROP CONSTRAINT IF EXISTS attendance_history_student_id_fkey;
      ALTER TABLE attendance_history
        ADD CONSTRAINT attendance_history_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await client.query("COMMIT");
    console.log("Added ON UPDATE CASCADE to student_id foreign keys.");
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
