import jwt from 'jsonwebtoken';
import UserService from '../models/UserService.js';

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  // Generate JWT token
  generateToken(payload) {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Register new user
  async register(email, password, name) {
    try {
      // Create new user in Supabase
      const user = await UserService.createUser({
        email: email.toLowerCase(),
        password,
        name
      });

      // Generate token
      const token = this.generateToken({
        id: user.id,
        email: user.email
      });

      // Return user data without password
      const userData = { ...user };
      delete userData.password_hash;

      return {
        user: userData,
        token,
        success: true
      };
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      // Find user by email
      const user = await UserService.findByEmail(email.toLowerCase());
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await UserService.comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate token
      const token = this.generateToken({
        id: user.id,
        email: user.email
      });

      // Return user data without password
      const userData = { ...user };
      delete userData.password_hash;

      return {
        user: userData,
        token,
        success: true
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user by token
  async getUserByToken(token) {
    try {
      const decoded = this.verifyToken(token);
      const user = await UserService.findById(decoded.id);

      if (!user) {
        throw new Error('User not found');
      }

      // Remove password hash from user object
      const userData = { ...user };
      delete userData.password_hash;

      return userData;
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userId, updates) {
    try {
      const user = await UserService.updateProfile(userId, updates);

      if (!user) {
        throw new Error('User not found');
      }

      // Remove password hash from user object
      const userData = { ...user };
      delete userData.password_hash;

      return userData;
    } catch (error) {
      throw error;
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await UserService.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await UserService.comparePassword(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      await UserService.updatePassword(userId, newPassword);

      return { message: 'Password updated successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Update API keys
  async updateApiKeys(userId, provider, apiKey) {
    try {
      await UserService.updateApiKeys(userId, provider, apiKey);
      return { message: 'API key updated successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Get decrypted API keys
  getDecryptedApiKeys(user) {
    return UserService.getDecryptedApiKeys(user);
  }
}

export default new AuthService();
