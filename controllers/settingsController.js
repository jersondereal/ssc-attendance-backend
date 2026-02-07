const Setting = require("../models/Setting");
const db = require("../config/database");

const DEFAULT_FEATURE_ACCESS = {
  viewer: { studentRegistration: true },
  moderator: {
    studentRegistration: true,
    addEvent: true,
    editEvent: true,
    deleteEvent: true,
  },
};

const DEFAULT_GENERAL_SETTINGS = {
  appName: "SSC Attendance Online",
  councilName: "Student Supreme Council",
  logoData: "",
};

const parseFeatureAccess = (value) => {
  if (!value) return DEFAULT_FEATURE_ACCESS;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? DEFAULT_FEATURE_ACCESS;
  } catch {
    return DEFAULT_FEATURE_ACCESS;
  }
};

const parseMaintenanceMode = (value) => value === "true";

const settingsController = {
  async getGeneralSettings(req, res) {
    try {
      const [appNameValue, councilNameValue, logoDataValue] = await Promise.all(
        [
          Setting.getValue("general", "app_name"),
          Setting.getValue("general", "council_name"),
          Setting.getValue("general", "logo_data"),
        ]
      );

      res.json({
        appName: appNameValue ?? DEFAULT_GENERAL_SETTINGS.appName,
        councilName: councilNameValue ?? DEFAULT_GENERAL_SETTINGS.councilName,
        logoData: logoDataValue ?? DEFAULT_GENERAL_SETTINGS.logoData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching general settings",
        error: error.message,
      });
    }
  },

  async updateGeneralSettings(req, res) {
    try {
      const { appName, councilName, logoData } = req.body;
      const updates = [];

      if (appName !== undefined) {
        updates.push(
          Setting.upsert("general", "app_name", appName, "Application name")
        );
      }

      if (councilName !== undefined) {
        updates.push(
          Setting.upsert("general", "council_name", councilName, "Council name")
        );
      }

      if (logoData !== undefined) {
        updates.push(
          Setting.upsert("general", "logo_data", logoData, "Logo data (base64)")
        );
      }

      await Promise.all(updates);

      res.json({ message: "General settings updated" });
    } catch (error) {
      res.status(500).json({
        message: "Error updating general settings",
        error: error.message,
      });
    }
  },
  async getSystemSettings(req, res) {
    try {
      const [featureAccessValue, maintenanceValue] = await Promise.all([
        Setting.getValue("system", "feature_access"),
        Setting.getValue("system", "maintenance_mode"),
      ]);

      res.json({
        featureAccess: parseFeatureAccess(featureAccessValue),
        maintenanceMode: parseMaintenanceMode(maintenanceValue),
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching system settings",
        error: error.message,
      });
    }
  },

  async updateSystemSettings(req, res) {
    try {
      const { featureAccess, maintenanceMode } = req.body;
      const updates = [];

      if (featureAccess !== undefined) {
        updates.push(
          Setting.upsert(
            "system",
            "feature_access",
            JSON.stringify(featureAccess),
            "Feature access configuration"
          )
        );
      }

      if (maintenanceMode !== undefined) {
        updates.push(
          Setting.upsert(
            "system",
            "maintenance_mode",
            maintenanceMode ? "true" : "false",
            "Maintenance mode flag"
          )
        );
      }

      await Promise.all(updates);

      res.json({
        message: "System settings updated",
      });
    } catch (error) {
      res.status(500).json({
        message: "Error updating system settings",
        error: error.message,
      });
    }
  },

  async getBackup(req, res) {
    try {
      const [users, settings, colleges, students, events, attendance] =
        await Promise.all([
          db.query("SELECT * FROM users ORDER BY id"),
          db.query("SELECT * FROM settings ORDER BY id"),
          db.query("SELECT * FROM colleges ORDER BY id"),
          db.query("SELECT * FROM students ORDER BY id"),
          db.query("SELECT * FROM events ORDER BY id"),
          db.query("SELECT * FROM attendance ORDER BY id"),
        ]);

      res.json({
        users: users.rows,
        settings: settings.rows,
        colleges: colleges.rows,
        students: students.rows,
        events: events.rows,
        attendance: attendance.rows,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        message: "Error creating backup",
        error: error.message,
      });
    }
  },

  async restoreBackup(req, res) {
    const { users, settings, colleges, students, events, attendance } =
      req.body;
    if (
      !Array.isArray(users) ||
      !Array.isArray(settings) ||
      !Array.isArray(colleges) ||
      !Array.isArray(students) ||
      !Array.isArray(events) ||
      !Array.isArray(attendance)
    ) {
      return res.status(400).json({
        message: "Invalid backup format",
      });
    }

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "TRUNCATE attendance, events, students, colleges, settings, users RESTART IDENTITY CASCADE"
      );

      for (const user of users) {
        await client.query(
          `INSERT INTO users (id, username, password, role, last_login, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            user.id,
            user.username,
            user.password,
            user.role,
            user.last_login,
            user.created_at,
            user.updated_at,
          ]
        );
      }

      for (const setting of settings) {
        await client.query(
          `INSERT INTO settings (id, category, key, value, description)
           VALUES ($1,$2,$3,$4,$5)`,
          [
            setting.id,
            setting.category,
            setting.key,
            setting.value,
            setting.description,
          ]
        );
      }

      for (const college of colleges) {
        await client.query(
          `INSERT INTO colleges (id, code, name, display_order, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            college.id,
            college.code,
            college.name,
            college.display_order,
            college.created_at,
            college.updated_at,
          ]
        );
      }

      for (const student of students) {
        await client.query(
          `INSERT INTO students (id, student_id, name, college, year, section, rfid, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            student.id,
            student.student_id,
            student.name,
            student.college,
            student.year,
            student.section,
            student.rfid,
            student.created_at,
            student.updated_at,
          ]
        );
      }

      for (const event of events) {
        await client.query(
          `INSERT INTO events (id, title, event_date, location, fine, courses, sections, school_years, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            event.id,
            event.title,
            event.event_date,
            event.location,
            event.fine,
            event.courses,
            event.sections,
            event.school_years,
            event.created_at,
            event.updated_at,
          ]
        );
      }

      for (const record of attendance) {
        await client.query(
          `INSERT INTO attendance (id, student_id, event_id, status, is_paid, check_in_time, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            record.id,
            record.student_id,
            record.event_id,
            record.status,
            record.is_paid,
            record.check_in_time,
            record.created_at,
            record.updated_at,
          ]
        );
      }

      await client.query("COMMIT");
      res.json({ message: "Backup restored successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(500).json({
        message: "Error restoring backup",
        error: error.message,
      });
    } finally {
      client.release();
    }
  },
};

module.exports = settingsController;
