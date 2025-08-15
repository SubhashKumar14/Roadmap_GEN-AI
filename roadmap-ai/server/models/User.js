import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true
  },
  profileImage: String,
  bio: String,
  location: String,
  githubUsername: String,
  twitterUsername: String,
  learningGoals: [String],
  
  // API Keys (encrypted)
  apiKeys: {
    openai: String,
    gemini: String,
    perplexity: String
  },
  
  // User Stats
  stats: {
    streak: { type: Number, default: 0 },
    totalCompleted: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    experiencePoints: { type: Number, default: 0 },
    weeklyGoal: { type: Number, default: 10 },
    weeklyProgress: { type: Number, default: 0 },
    roadmapsCompleted: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 },
    globalRanking: { type: Number, default: 999999 },
    attendedContests: { type: Number, default: 0 },
    problemsSolved: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    }
  },
  
  // Activity tracking
  activeLearningDays: [String], // Array of date strings (YYYY-MM-DD)
  lastActiveDate: Date,
  streakStartDate: Date,
  
  // Preferences
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: true },
    achievementAlerts: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update streak logic
userSchema.methods.updateStreak = function() {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayString = todayStart.toISOString().split('T')[0];
  
  if (!this.lastActiveDate) {
    this.stats.streak = 1;
    this.streakStartDate = todayStart;
  } else {
    const lastActiveStart = new Date(
      this.lastActiveDate.getFullYear(),
      this.lastActiveDate.getMonth(),
      this.lastActiveDate.getDate()
    );
    
    const daysDiff = Math.floor((todayStart - lastActiveStart) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      this.stats.streak += 1;
    } else if (daysDiff > 1) {
      // Streak broken
      this.stats.streak = 1;
      this.streakStartDate = todayStart;
    }
    // If daysDiff === 0, same day, no change to streak
  }
  
  this.lastActiveDate = today;
  
  // Add to active learning days
  if (!this.activeLearningDays.includes(todayString)) {
    this.activeLearningDays.push(todayString);
  }
};

// Calculate level based on experience points
userSchema.methods.updateLevel = function() {
  const newLevel = Math.floor(this.stats.experiencePoints / 300) + 1;
  if (newLevel > this.stats.level) {
    this.stats.level = newLevel;
    return true; // Level up occurred
  }
  return false;
};

export default mongoose.model('User', userSchema);
