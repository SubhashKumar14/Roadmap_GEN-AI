import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import { Achievement, UserAchievement } from '../models/Achievement.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation middleware
const validateActivityData = [
  body('type').isIn(['task_completed', 'module_completed', 'roadmap_completed', 'study_session']).withMessage('Invalid activity type'),
  body('count').optional().isInt({ min: 1 }).withMessage('Count must be a positive integer')
];

// Get progress summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    let progress = await Progress.findOne({ userId: req.user._id });
    
    if (!progress) {
      progress = new Progress({ userId: req.user._id });
      await progress.save();
    }

    // Update streak calculation
    progress.updateStreak();
    await progress.save();

    const summary = {
      totalContributions: progress.totalContributions,
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
      weeklySummary: progress.weeklySummary,
      monthlySummary: progress.monthlySummary,
      activities: progress.activities.slice(-30) // Last 30 days
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching progress summary:', error);
    res.status(500).json({ error: 'Failed to fetch progress summary' });
  }
});

// Get activity data for calendar visualization
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    let progress = await Progress.findOne({ userId: req.user._id });
    
    if (!progress) {
      progress = new Progress({ userId: req.user._id });
      await progress.save();
    }

    const activityData = progress.getYearContributions(parseInt(year));

    res.json({
      year: parseInt(year),
      totalContributions: progress.totalContributions,
      currentStreak: progress.currentStreak,
      activityData
    });
  } catch (error) {
    console.error('Error fetching activity data:', error);
    res.status(500).json({ error: 'Failed to fetch activity data' });
  }
});

// Add activity (called when user completes tasks)
router.post('/activity', authenticateToken, validateActivityData, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array().msg });
    }

    const { type, count = 1 } = req.body;
    const userId = req.user._id;

    let progress = await Progress.findOne({ userId });
    
    if (!progress) {
      progress = new Progress({ userId });
    }

    // Add activity for today
    const today = new Date();
    progress.addActivity(today, count);
    
    await progress.save();

    // Update user's activity tracking
    const user = await User.findById(userId);
    if (user && type === 'task_completed') {
      user.updateStreak();
      await user.save();
    }

    console.log(`📊 Activity recorded:`, {
      userId,
      type,
      count,
      date: today.toISOString().split('T')[0]
    });

    res.json({
      message: 'Activity recorded successfully',
      currentStreak: progress.currentStreak,
      totalContributions: progress.totalContributions
    });
  } catch (error) {
    console.error('❌ Error recording activity:', error);
    res.status(500).json({ error: 'Failed to record activity' });
  }
});

// Check and award achievements
router.post('/check-achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all available achievements
    const achievements = await Achievement.find({ isActive: true });
    
    // Get user's current achievements
    const userAchievements = await UserAchievement.find({ userId });
    const earnedAchievementIds = userAchievements.map(ua => ua.achievementId.toString());

    const newAchievements = [];

    for (const achievement of achievements) {
      // Skip if already earned
      if (earnedAchievementIds.includes(achievement._id.toString())) {
        continue;
      }

      let qualifies = false;

      // Check achievement criteria
      switch (achievement.criteria.type) {
        case 'tasks_completed':
          qualifies = user.stats.totalCompleted >= achievement.criteria.value;
          break;
          
        case 'streak_days':
          qualifies = user.stats.streak >= achievement.criteria.value;
          break;
          
        case 'roadmaps_completed':
          qualifies = user.stats.roadmapsCompleted >= achievement.criteria.value;
          break;
          
        case 'time_spent':
          qualifies = user.stats.totalStudyTime >= achievement.criteria.value;
          break;
          
        default:
          continue;
      }

      if (qualifies) {
        // Award the achievement
        const userAchievement = new UserAchievement({
          userId,
          achievementId: achievement._id,
          isCompleted: true
        });

        await userAchievement.save();
        
        // Award experience points
        if (achievement.rewards.experiencePoints) {
          user.stats.experiencePoints += achievement.rewards.experiencePoints;
        }

        newAchievements.push({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          rewards: achievement.rewards,
          earnedAt: userAchievement.earnedAt
        });

        console.log(`🏆 Achievement earned:`, {
          userId,
          achievement: achievement.title,
          rewards: achievement.rewards
        });
      }
    }

    // Update user level
    const leveledUp = user.updateLevel();
    await user.save();

    res.json({
      newAchievements,
      leveledUp,
      currentLevel: user.stats.level,
      experiencePoints: user.stats.experiencePoints
    });
  } catch (error) {
    console.error('❌ Error checking achievements:', error);
    res.status(500).json({ error: 'Failed to check achievements' });
  }
});

// Get user achievements
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const userAchievements = await UserAchievement.find({ 
      userId, 
      isCompleted: true 
    }).populate('achievementId');

    const achievements = userAchievements.map(ua => ({
      id: ua.achievementId.id,
      title: ua.achievementId.title,
      description: ua.achievementId.description,
      icon: ua.achievementId.icon,
      category: ua.achievementId.category,
      difficulty: ua.achievementId.difficulty,
      rewards: ua.achievementId.rewards,
      earnedAt: ua.earnedAt
    }));

    res.json(achievements);
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Get achievement progress (for partially completed achievements)
router.get('/achievement-progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all achievements
    const achievements = await Achievement.find({ isActive: true });
    
    // Get user's earned achievements
    const userAchievements = await UserAchievement.find({ userId });
    const earnedIds = userAchievements.map(ua => ua.achievementId.toString());

    const progressData = achievements.map(achievement => {
      const isEarned = earnedIds.includes(achievement._id.toString());
      
      let progress = 0;
      let current = 0;

      if (!isEarned) {
        // Calculate progress for unearned achievements
        switch (achievement.criteria.type) {
          case 'tasks_completed':
            current = user.stats.totalCompleted;
            break;
          case 'streak_days':
            current = user.stats.streak;
            break;
          case 'roadmaps_completed':
            current = user.stats.roadmapsCompleted;
            break;
          case 'time_spent':
            current = user.stats.totalStudyTime;
            break;
        }
        
        progress = Math.min(100, (current / achievement.criteria.value) * 100);
      } else {
        progress = 100;
        current = achievement.criteria.value;
      }

      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        category: achievement.category,
        difficulty: achievement.difficulty,
        criteria: achievement.criteria,
        progress,
        current,
        target: achievement.criteria.value,
        earned: isEarned,
        earnedAt: isEarned ? userAchievements.find(ua => 
          ua.achievementId.toString() === achievement._id.toString()
        )?.earnedAt : null
      };
    });

    res.json(progressData);
  } catch (error) {
    console.error('Error fetching achievement progress:', error);
    res.status(500).json({ error: 'Failed to fetch achievement progress' });
  }
});

// Get weekly/monthly progress reports
router.get('/reports', authenticateToken, async (req, res) => {
  try {
    const { period = 'week' } = req.query; // week, month, year
    const userId = req.user._id;

    const progress = await Progress.findOne({ userId });
    
    if (!progress) {
      return res.json({
        period,
        activities: [],
        summary: {
          tasksCompleted: 0,
          timeSpent: 0,
          activeDays: 0
        }
      });
    }

    let startDate;
    const endDate = new Date();

    switch (period) {
      case 'week':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T');

    const periodActivities = progress.activities.filter(activity => 
      activity.date >= startDateStr && activity.date <= endDateStr
    );

    const summary = {
      tasksCompleted: periodActivities.reduce((sum, a) => sum + a.tasksCompleted, 0),
      timeSpent: periodActivities.reduce((sum, a) => sum + a.timeSpent, 0),
      activeDays: periodActivities.filter(a => a.tasksCompleted > 0).length
    };

    res.json({
      period,
      startDate: startDateStr,
      endDate: endDateStr,
      activities: periodActivities,
      summary
    });
  } catch (error) {
    console.error('Error generating progress report:', error);
    res.status(500).json({ error: 'Failed to generate progress report' });
  }
});

export default router;
