import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD format
  tasksCompleted: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 }, // in minutes
  roadmapsWorkedOn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' }],
  activityLevel: { type: Number, default: 0, min: 0, max: 4 } // 0-4 scale like GitHub
});

const progressSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  
  // Daily activity data
  activities: [activitySchema],
  
  // Current year statistics
  currentYear: { type: Number, default: () => new Date().getFullYear() },
  totalContributions: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  
  // GitHub/LeetCode style contribution data
  contributionData: [{
    date: String, // YYYY-MM-DD
    count: { type: Number, default: 0 },
    level: { type: Number, default: 0, min: 0, max: 4 }
  }],
  
  // Weekly and monthly summaries
  weeklySummary: {
    tasksCompleted: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 },
    streak: { type: Number, default: 0 }
  },
  
  monthlySummary: {
    tasksCompleted: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 },
    roadmapsCompleted: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Method to add daily activity
progressSchema.methods.addActivity = function(date, tasksCompleted = 1, timeSpent = 0) {
  const dateStr = date.toISOString().split('T')[0];
  
  // Find existing activity for the date
  let activity = this.activities.find(a => a.date === dateStr);
  
  if (activity) {
    activity.tasksCompleted += tasksCompleted;
    activity.timeSpent += timeSpent;
    activity.activityLevel = Math.min(4, Math.floor(activity.tasksCompleted / 2));
  } else {
    activity = {
      date: dateStr,
      tasksCompleted,
      timeSpent,
      activityLevel: Math.min(4, Math.floor(tasksCompleted / 2))
    };
    this.activities.push(activity);
  }
  
  // Update contribution data
  this.updateContributionData(dateStr, activity.tasksCompleted, activity.activityLevel);
  
  // Update streak
  this.updateStreak();
};

// Method to update contribution data (GitHub style)
progressSchema.methods.updateContributionData = function(date, count, level) {
  let contribution = this.contributionData.find(c => c.date === date);
  
  if (contribution) {
    contribution.count = count;
    contribution.level = level;
  } else {
    this.contributionData.push({ date, count, level });
  }
};

// Method to calculate current streak
progressSchema.methods.updateStreak = function() {
  const sortedActivities = this.activities
    .filter(a => a.tasksCompleted > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (sortedActivities.length === 0) {
    this.currentStreak = 0;
    return;
  }
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const activity of sortedActivities) {
    const activityDate = new Date(activity.date);
    const daysDiff = Math.floor((currentDate - activityDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  this.currentStreak = streak;
  this.longestStreak = Math.max(this.longestStreak, streak);
};

// Method to get year contribution data
progressSchema.methods.getYearContributions = function(year = new Date().getFullYear()) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  const contributions = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const activity = this.activities.find(a => a.date === dateStr);
    
    contributions.push({
      date: dateStr,
      count: activity ? activity.tasksCompleted : 0,
      level: activity ? activity.activityLevel : 0
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return contributions;
};

export default mongoose.model('Progress', progressSchema);
