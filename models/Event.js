const db = require("../config/database");

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
    const {
      title,
      event_date,
      location,
      fine,
      courses,
      sections,
      schoolYears,
    } = eventData;

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
        courses || { all: false, bsit: false, bshm: false, bscrim: false }
      ),
      JSON.stringify(
        sections || { all: false, a: false, b: false, c: false, d: false }
      ),
      JSON.stringify(
        schoolYears || { all: false, 1: false, 2: false, 3: false, 4: false }
      ),
    ]);
    const newEvent = eventResult.rows[0];

    // Get students based on selected courses, sections, and school years
    let studentsQuery =
      "SELECT id, student_id, course, year, section FROM students WHERE 1=1";
    const studentsParams = [];
    let paramCount = 1;

    // Filter by courses if not "all" selected
    if (courses && !courses.all) {
      const selectedCourses = Object.keys(courses).filter(
        (key) => key !== "all" && courses[key]
      );
      if (selectedCourses.length > 0) {
        const courseConditions = selectedCourses
          .map(() => `course = $${paramCount++}`)
          .join(" OR ");
        studentsQuery += ` AND (${courseConditions})`;
        studentsParams.push(
          ...selectedCourses.map((course) => course.toLowerCase())
        );
      }
    }

    // Filter by sections if not "all" selected
    if (sections && !sections.all) {
      const selectedSections = Object.keys(sections).filter(
        (key) => key !== "all" && sections[key]
      );
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
      const selectedYears = Object.keys(schoolYears).filter(
        (key) => key !== "all" && schoolYears[key]
      );
      if (selectedYears.length > 0) {
        const yearConditions = selectedYears
          .map(() => `year = $${paramCount++}`)
          .join(" OR ");
        studentsQuery += ` AND (${yearConditions})`;
        studentsParams.push(...selectedYears);
      }
    }

    const studentsResult = await db.query(studentsQuery, studentsParams);
    const students = studentsResult.rows;

    // Create attendance records for filtered students
    if (students.length > 0) {
      const values = [];
      const attendanceParams = [];
      let attendanceParamCount = 1;

      students.forEach((student) => {
        values.push(
          `($${attendanceParamCount}, $${attendanceParamCount + 1}, $${
            attendanceParamCount + 2
          }, $${attendanceParamCount + 3})`
        );
        attendanceParams.push(
          student.student_id,
          newEvent.id,
          "Absent",
          new Date()
        );
        attendanceParamCount += 4;
      });

      const attendanceQuery = `
        INSERT INTO attendance (student_id, event_id, status, check_in_time)
        VALUES ${values.join(", ")}
      `;
      await db.query(attendanceQuery, attendanceParams);
    }

    return newEvent;
  }

  static async update(id, eventData) {
    const {
      title,
      event_date,
      location,
      fine,
      courses,
      sections,
      schoolYears,
    } = eventData;
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
        courses || { all: false, bsit: false, bshm: false, bscrim: false }
      ),
      JSON.stringify(
        sections || { all: false, a: false, b: false, c: false, d: false }
      ),
      JSON.stringify(
        schoolYears || { all: false, 1: false, 2: false, 3: false, 4: false }
      ),
      id,
    ]);
    return result.rows[0];
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
