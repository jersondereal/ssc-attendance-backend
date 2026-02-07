const db = require("../config/database");

class Setting {
  static async getValue(category, key) {
    const query = "SELECT value FROM settings WHERE category = $1 AND key = $2";
    const result = await db.query(query, [category, key]);
    return result.rows[0]?.value ?? null;
  }

  static async upsert(category, key, value, description = null) {
    const query = `
      INSERT INTO settings (category, key, value, description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (category, key)
      DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description
      RETURNING *
    `;
    const result = await db.query(query, [category, key, value, description]);
    return result.rows[0];
  }
}

module.exports = Setting;
