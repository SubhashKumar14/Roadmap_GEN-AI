import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
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
      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Create new user
      const user = new User({
        email: email.toLowerCase(),
        password,
        name
      });

      await user.save();

      // Generate token
      const token = this.generateToken({
        id: user._id,
        email: user.email
      });

      // Return user data without password
      const userData = user.toObject();
      delete userData.password;

      return {
        user: userData,
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate token
      const token = this.generateToken({
        id: user._id,
        email: user.email
      });

      // Return user data without password
      const userData = user.toObject();
      delete userData.password;

      return {
        user: userData,
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user by token
  async getUserByToken(token) {
    try {
      const decoded = this.verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userId, updates) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      return { message: 'Password updated successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Update API keys
  async updateApiKeys(userId, provider, apiKey) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Encrypt API key (simple base64 encoding - in production use proper encryption)
      const encryptedKey = Buffer.from(apiKey).toString('base64');
      
      user.apiKeys[provider] = encryptedKey;
      await user.save();

      return { message: 'API key updated successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Get decrypted API keys
  getDecryptedApiKeys(user) {
    const decryptedKeys = {};
    
    if (user.apiKeys) {
      Object.entries(user.apiKeys).forEach(([provider, encryptedKey]) => {
        if (encryptedKey) {
          try {
            decryptedKeys[provider] = Buffer.from(encryptedKey, 'base64').toString('utf-8');
          } catch (error) {
            console.error(`Error decrypting ${provider} API key:`, error);
          }
        }
      });
    }
    
    return decryptedKeys;
  }
}

export default new AuthService();
