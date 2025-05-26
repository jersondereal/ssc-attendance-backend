const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Secret key for JWT signing - in production, use environment variable
const JWT_SECRET = 'jinky143'; // TODO: Move to environment variable

const userController = {
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validate request body
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      const user = await User.findByUsername(username);

      // User not found
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isPasswordValid = await User.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login timestamp
      const updatedUser = await User.updateLastLogin(user.id);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Return user data and token
      res.json({
        token,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role,
          last_login: updatedUser.last_login,
          created_at: updatedUser.created_at
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'An error occurred during login' });
    }
  },

  async getAllUsers(req, res) {
    try {
      const users = await User.findAll();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
  },

  async createUser(req, res) {
    try {
      const { username, password, role } = req.body;

      // Validate request body
      if (!username || !password || !role) {
        return res.status(400).json({ message: 'Username, password, and role are required' });
      }

      // Check if username already exists
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Create user with hashed password
      const user = await User.create(username, password, role);

      // Return user data without password
      res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        created_at: user.created_at
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Error creating user', error: error.message });
    }
  },

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, password, role } = req.body;

      // Check if username already exists for other users
      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Update user with optional password update
      const user = await User.update(id, { username, password, role });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Error updating user', error: error.message });
    }
  },

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.delete(id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
  }
};

module.exports = userController; 