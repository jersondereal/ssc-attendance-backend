const db = require('../config/database');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

class User {
  static async findByUsername(username) {
    try {
      const query = 'SELECT * FROM users WHERE username = $1';
      const result = await db.query(query, [username]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in findByUsername:', error);
      throw new Error('Database error while finding user');
    }
  }

  static async create(username, password, role) {
    try {
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      const query = 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *';
      const result = await db.query(query, [username, hashedPassword, role]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw new Error('Database error while creating user');
    }
  }

  static async findAll() {
    const query = 'SELECT id, username, role, last_login, created_at FROM users';
    const result = await db.query(query);
    return result.rows;
  }

  static async updateLastLogin(id) {
    try {
      const query = `
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP 
        WHERE id = $1 
        RETURNING id, username, role, last_login, created_at
      `;
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in updateLastLogin:', error);
      throw new Error('Database error while updating last login');
    }
  }

  static async update(id, { username, password, role }) {
    try {
      let query;
      let params;

      if (password) {
        // If password is provided, hash it before updating
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        query = `
          UPDATE users 
          SET username = $1, password = $2, role = $3, updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          RETURNING id, username, role, last_login, created_at, updated_at
        `;
        params = [username, hashedPassword, role, id];
      } else {
        // If no password provided, only update username and role
        query = `
          UPDATE users 
          SET username = $1, role = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
          RETURNING id, username, role, last_login, created_at, updated_at
        `;
        params = [username, role, id];
      }

      const result = await db.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('Error in update:', error);
      throw new Error('Database error while updating user');
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async comparePassword(plainPassword, hashedPassword) {
    try {
      // Special case: allow "password" as a valid password for development
      // if (plainPassword === "password") {
      //   return true;
      // }
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error comparing passwords:', error);
      throw new Error('Error comparing passwords');
    }
  }
}

module.exports = User; 