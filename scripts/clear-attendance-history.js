/**
 * One-time maintenance: clear ALL rows from the attendance_history audit log.
 *
 * WARNING: This is destructive and irreversible. It empties attendance_history
 * entirely and resets its id sequence. Nothing references attendance_history,
 * so a TRUNCATE is safe (no CASCADE needed). It does NOT touch the attendance
 * table itself — only the change-history log.
 *
 * Run from the backend directory:  node scripts/clear-attendance-history.js
 */
const db = require("../config/database");

async function main() {
  const before = await db.query("SELECT COUNT(*) AS count FROM attendance_history");
  const count = Number(before.rows[0].count);
  console.log(`attendance_history rows before: ${count}`);

  if (count === 0) {
    console.log("Table is already empty. Nothing to clear.");
    return;
  }

  await db.query("TRUNCATE TABLE attendance_history RESTART IDENTITY");

  const after = await db.query("SELECT COUNT(*) AS count FROM attendance_history");
  console.log(`attendance_history rows after:  ${after.rows[0].count}`);
  console.log(`Cleared ${count} row(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Clear failed:", err);
    process.exit(1);
  });
