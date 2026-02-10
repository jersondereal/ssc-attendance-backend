const db = require("../config/database");

const getSelectedKeys = (selection = {}) =>
  Object.keys(selection).filter((key) => key !== "all" && selection[key]);

const getFilteredStudentIds = async ({ colleges, sections, schoolYears }) => {
  let studentsQuery = "SELECT student_id FROM students WHERE 1=1";
  const studentsParams = [];
  let paramCount = 1;

  // Filter by colleges if not "all" selected
  if (colleges && !colleges.all) {
    const selectedColleges = getSelectedKeys(colleges);
    if (selectedColleges.length > 0) {
      const collegeConditions = selectedColleges
        .map(() => `college = $${paramCount++}`)
        .join(" OR ");
      studentsQuery += ` AND (${collegeConditions})`;
      studentsParams.push(
        ...selectedColleges.map((college) => college.toLowerCase())
      );
    }
  }

  // Filter by sections if not "all" selected
  if (sections && !sections.all) {
    const selectedSections = getSelectedKeys(sections);
    if (selectedSections.length > 0) {
      const sectionConditions = selectedSections
        .map(() => `section = $${paramCount++}`)
        .join(" OR ");
      studentsQuery += ` AND (${sectionConditions})`;
      studentsParams.push(
        ...selectedSections.map((section) => section.toLowerCase())
      );
    }
  }

  // Filter by school years if not "all" selected
  if (schoolYears && !schoolYears.all) {
    const selectedYears = getSelectedKeys(schoolYears);
    if (selectedYears.length > 0) {
      const yearConditions = selectedYears
        .map(() => `year = $${paramCount++}`)
        .join(" OR ");
      studentsQuery += ` AND (${yearConditions})`;
      studentsParams.push(...selectedYears);
    }
  }

  const studentsResult = await db.query(studentsQuery, studentsParams);
  return studentsResult.rows.map((student) => student.student_id);
};

const syncAttendanceForEvent = async (eventId, filters) => {
  const eligibleStudentIds = await getFilteredStudentIds(filters);

  if (eligibleStudentIds.length === 0) {
    await db.query("DELETE FROM attendance WHERE event_id = $1", [eventId]);
    return;
  }

  await db.query(
    `
      DELETE FROM attendance
      WHERE event_id = $1
        AND NOT (student_id = ANY($2::varchar[]))
    `,
    [eventId, eligibleStudentIds]
  );

  await db.query(
    `
      INSERT INTO attendance (student_id, event_id, status, check_in_time)
      SELECT student_id, $2, 'Absent', CURRENT_TIMESTAMP
      FROM UNNEST($1::varchar[]) AS student_id
      ON CONFLICT (student_id, event_id) DO NOTHING
    `,
    [eligibleStudentIds, eventId]
  );
};

class Event {
  static async findAll() {
    const query = "SELECT * FROM events ORDER BY event_date DESC";
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = "SELECT * FROM events WHERE id = $1";
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async create(eventData) {
    const { title, event_date, location, fine, sections, schoolYears } =
      eventData;
    const colleges = eventData.colleges ?? eventData.courses;

    // Create the event
    const eventQuery = `
      INSERT INTO events (title, event_date, location, fine, courses, sections, school_years)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const eventResult = await db.query(eventQuery, [
      title,
      event_date,
      location,
      fine,
      JSON.stringify(
        colleges || { all: false, bsit: false, bshm: false, bscrim: false }
      ),
      JSON.stringify(
        sections || { all: false, a: false, b: false, c: false, d: false }
      ),
      JSON.stringify(
        schoolYears || { all: false, 1: false, 2: false, 3: false, 4: false }
      ),
    ]);
    const newEvent = eventResult.rows[0];

    await syncAttendanceForEvent(newEvent.id, { colleges, sections, schoolYears });

    return newEvent;
  }

  static async update(id, eventData) {
    const { title, event_date, location, fine, sections, schoolYears } =
      eventData;
    const colleges = eventData.colleges ?? eventData.courses;
    const query = `
      UPDATE events 
      SET title = $1, event_date = $2, location = $3, fine = $4, 
          courses = $5, sections = $6, school_years = $7
      WHERE id = $8
      RETURNING *
    `;
    const result = await db.query(query, [
      title,
      event_date,
      location,
      fine,
      JSON.stringify(
        colleges || { all: false, bsit: false, bshm: false, bscrim: false }
      ),
      JSON.stringify(
        sections || { all: false, a: false, b: false, c: false, d: false }
      ),
      JSON.stringify(
        schoolYears || { all: false, 1: false, 2: false, 3: false, 4: false }
      ),
      id,
    ]);
    const updatedEvent = result.rows[0];
    if (!updatedEvent) {
      return undefined;
    }

    await syncAttendanceForEvent(id, { colleges, sections, schoolYears });

    return updatedEvent;
  }

  static async delete(id) {
    const query = "DELETE FROM events WHERE id = $1 RETURNING *";
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByDate(date) {
    const query = "SELECT * FROM events WHERE event_date = $1 ORDER BY id";
    const result = await db.query(query, [date]);
    return result.rows;
  }
}

module.exports = Event;
