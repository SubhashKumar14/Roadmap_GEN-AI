import supabase from '../config/supabase.js';
import bcrypt from 'bcryptjs';

class UserService {
  // Create new user
  async createUser(userData) {
    const { email, password, name } = userData;
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: email.toLowerCase(),
          password_hash: hashedPassword,
          name
        }
      ])
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('User already exists with this email');
      }
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
  
  // Find user by email
  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
  
  // Find user by ID
  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
  
  // Compare password
  async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
  
  // Update user profile
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
  
  // Update password
  async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const { data, error } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
  
  // Update API keys
  async updateApiKeys(userId, provider, apiKey) {
    // Get current user to merge API keys
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Encrypt API key (simple base64 encoding - in production use proper encryption)
    const encryptedKey = Buffer.from(apiKey).toString('base64');
    
    const updatedApiKeys = {
      ...user.api_keys,
      [provider]: encryptedKey
    };
    
    const { data, error } = await supabase
      .from('users')
      .update({
        api_keys: updatedApiKeys,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
  
  // Update user stats
  async updateStats(userId, statsUpdate) {
    // Get current user to merge stats
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedStats = {
      ...user.stats,
      ...statsUpdate
    };
    
    const { data, error } = await supabase
      .from('users')
      .update({
        stats: updatedStats,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
  
  // Update streak and activity
  async updateActivity(userId) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    let newStreak = 1;
    let streakStartDate = today;
    
    if (user.last_active_date) {
      const lastActiveDate = new Date(user.last_active_date);
      const lastActiveDateString = lastActiveDate.toISOString().split('T')[0];
      
      if (lastActiveDateString === todayString) {
        // Same day, no change
        return user;
      }
      
      const daysDiff = Math.floor((today - lastActiveDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day
        newStreak = (user.stats?.streak || 0) + 1;
        streakStartDate = user.streak_start_date || today;
      } else if (daysDiff > 1) {
        // Streak broken
        newStreak = 1;
        streakStartDate = today;
      }
    }
    
    // Add to active learning days
    const activeDays = user.active_learning_days || [];
    if (!activeDays.includes(todayString)) {
      activeDays.push(todayString);
    }
    
    const updatedStats = {
      ...user.stats,
      streak: newStreak
    };
    
    const { data, error } = await supabase
      .from('users')
      .update({
        stats: updatedStats,
        active_learning_days: activeDays,
        last_active_date: today.toISOString(),
        streak_start_date: streakStartDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
  
  // Get decrypted API keys
  getDecryptedApiKeys(user) {
    const decryptedKeys = {};
    
    if (user.api_keys) {
      Object.entries(user.api_keys).forEach(([provider, encryptedKey]) => {
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

export default new UserService();
