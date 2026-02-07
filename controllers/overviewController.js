const Overview = require("../models/Overview");

const RANGE_OPTIONS = new Set([
  "last_24_hours",
  "last_7_days",
  "last_30_days",
  "last_3_months",
  "last_12_months",
  "last_24_months",
]);

const getRangeDates = (range) => {
  const now = new Date();
  let start = new Date(now);

  switch (range) {
    case "last_24_hours":
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "last_7_days":
      start.setDate(start.getDate() - 7);
      break;
    case "last_30_days":
      start.setDate(start.getDate() - 30);
      break;
    case "last_3_months":
      start.setMonth(start.getMonth() - 3);
      break;
    case "last_12_months":
      start.setMonth(start.getMonth() - 12);
      break;
    case "last_24_months":
      start.setMonth(start.getMonth() - 24);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { startDate: start, endDate: now };
};

const resolveRange = (req) => {
  const range = req.query.range;
  return RANGE_OPTIONS.has(range) ? range : "last_30_days";
};

const overviewController = {
  async getStudentStats(req, res) {
    try {
      const totalStudents = await Overview.getTotalStudents();
      res.json({ totalStudents });
    } catch (error) {
      res
        .status(500)
        .json({
          message: "Error fetching student stats",
          error: error.message,
        });
    }
  },

  async getEventStats(req, res) {
    try {
      const range = resolveRange(req);
      const { startDate, endDate } = getRangeDates(range);
      const totalEvents = await Overview.getTotalEvents(startDate, endDate);
      res.json({ totalEvents, range });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching event stats", error: error.message });
    }
  },

  async getAttendanceStats(req, res) {
    try {
      const range = resolveRange(req);
      const { startDate, endDate } = getRangeDates(range);
      const averageAttendanceRate = await Overview.getAttendanceRate(
        startDate,
        endDate
      );
      res.json({ averageAttendanceRate, range });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching attendance stats",
        error: error.message,
      });
    }
  },

  async getFinesStats(req, res) {
    try {
      const range = resolveRange(req);
      const { startDate, endDate } = getRangeDates(range);
      const { total_outstanding, total_collected } =
        await Overview.getFinesTotals(startDate, endDate);
      res.json({
        totalFinesOutstanding: total_outstanding,
        totalFinesCollected: total_collected,
        range,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching fines stats", error: error.message });
    }
  },
};

module.exports = overviewController;
