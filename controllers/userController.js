const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET_KEY;

const VALID_ROLES = ['administrator', 'moderator', 'viewer', 'president', 'vice_president'];

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
      res.status(500).json({ message: 'Error fetching users' });
    }
  },

  async createUser(req, res) {
    try {
      const { username, password, role } = req.body;

      // Validate request body
      if (!username || !password || !role) {
        return res.status(400).json({ message: 'Username, password, and role are required' });
      }

      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
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
      res.status(500).json({ message: 'Error creating user' });
    }
  },

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, password, role, currentPassword } = req.body;

      // Check if username already exists for other users
      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      if (role && !VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      if (password && password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }

      // Changing the password requires knowing the current one.
      if (password) {
        const targetUser = await User.findById(id);
        if (!targetUser) {
          return res.status(404).json({ message: 'User not found' });
        }
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required to change the password' });
        }
        const isCurrentValid = await User.comparePassword(currentPassword, targetUser.password);
        if (!isCurrentValid) {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }
      }

      // Update user with optional password update
      const user = await User.update(id, { username, password, role });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Error updating user' });
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
      res.status(500).json({ message: 'Error deleting user' });
    }
  }
};

module.exports = userController; 