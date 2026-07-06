const db = require("../config/database");

const RETENTION_INTERVAL = "6 months";
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function deleteExpiredAttendanceHistory() {
  try {
    await db.query(
      `DELETE FROM attendance_history WHERE changed_at < NOW() - INTERVAL '${RETENTION_INTERVAL}'`
    );
  } catch (error) {
    console.error("Error cleaning up attendance_history:", error);
  }
}

function startAttendanceHistoryCleanup() {
  deleteExpiredAttendanceHistory();
  setInterval(deleteExpiredAttendanceHistory, CLEANUP_INTERVAL_MS);
}

module.exports = { startAttendanceHistoryCleanup };
