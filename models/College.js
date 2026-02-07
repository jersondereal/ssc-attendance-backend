const db = require("../config/database");

class College {
  static async findAll() {
    const query = "SELECT * FROM colleges ORDER BY display_order ASC, code ASC";
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = "SELECT * FROM colleges WHERE id = $1";
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByCode(code) {
    const query = "SELECT * FROM colleges WHERE code = $1";
    const result = await db.query(query, [code]);
    return result.rows[0];
  }

  static async create(collegeData) {
    const { code, name, display_order } = collegeData;
    const query = `
      INSERT INTO colleges (code, name, display_order)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(query, [
      code?.toLowerCase().trim() ?? "",
      name?.trim() ?? "",
      display_order ?? 0,
    ]);
    return result.rows[0];
  }

  static async update(id, collegeData) {
    const { code, name, display_order } = collegeData;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (code !== undefined) {
      updates.push(`code = $${paramCount++}`);
      values.push(code?.toLowerCase().trim() ?? "");
    }
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name?.trim() ?? "");
    }
    if (display_order !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(display_order);
    }

    if (updates.length === 0) return College.findById(id);

    values.push(id);
    const query = `
      UPDATE colleges
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = "DELETE FROM colleges WHERE id = $1 RETURNING *";
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async countStudentsByCollegeCode(code) {
    const query =
      "SELECT COUNT(*)::int AS count FROM students WHERE college = $1";
    const result = await db.query(query, [code]);
    return result.rows[0]?.count ?? 0;
  }
}

module.exports = College;
