import express from 'express';
import { body, query, validationResult } from 'express-validator';
import User from '../models/User.js';
import Roadmap from '../models/Roadmap.js';
import Progress from '../models/Progress.js';
import { UserAchievement } from '../models/Achievement.js';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation middleware
const validatePreferences = [
  body('emailNotifications').optional().isBoolean(),
  body('weeklyDigest').optional().isBoolean(),
  body('achievementAlerts').optional().isBoolean(),
  body('theme').optional().isIn(['light', 'dark', 'system'])
];

const validateWeeklyGoal = [
  body('weeklyGoal').isInt({ min: 1, max: 100 }).withMessage('Weekly goal must be between 1 and 100')
];

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate additional stats
    const roadmaps = await Roadmap.find({ createdBy: req.user._id });
    const completedRoadmaps = roadmaps.filter(r => r.progress === 100);
    
    // Get current week progress (Monday to Sunday)
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Calculate weekly progress (this could be enhanced with actual activity tracking)
    const weeklyProgress = Math.min(user.stats.weeklyProgress, user.stats.weeklyGoal);

    const stats = {
      ...user.stats.toObject(),
      roadmapsCompleted: completedRoadmaps.length,
      activeLearningDays: user.activeLearningDays.length,
      lastActiveDate: user.lastActiveDate,
      streakStartDate: user.streakStartDate,
      weeklyProgress,
      // Additional calculated stats
      totalRoadmaps: roadmaps.length,
      averageRoadmapProgress: roadmaps.length > 0 
        ? roadmaps.reduce((sum, r) => sum + r.progress, 0) / roadmaps.length 
        : 0
    };

    console.log(`📊 User stats retrieved for ${user.email}:`, {
      totalCompleted: stats.totalCompleted,
      streak: stats.streak,
      level: stats.level,
      roadmapsCompleted: stats.roadmapsCompleted
    });

    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, validatePreferences, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const updates = {};
    const allowedFields = ['emailNotifications', 'weeklyDigest', 'achievementAlerts', 'theme'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[`preferences.${field}`] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Update learning goals
router.put('/learning-goals', authenticateToken, async (req, res) => {
  try {
    const { learningGoals } = req.body;
    
    if (!Array.isArray(learningGoals)) {
      return res.status(400).json({ error: 'Learning goals must be an array' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { learningGoals } },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Learning goals updated successfully',
      learningGoals: user.learningGoals
    });
  } catch (error) {
    console.error('Error updating learning goals:', error);
    res.status(500).json({ error: 'Failed to update learning goals' });
  }
});

// Update weekly goal
router.put('/weekly-goal', authenticateToken, validateWeeklyGoal, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { weeklyGoal } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { 'stats.weeklyGoal': weeklyGoal } },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Weekly goal updated successfully',
      weeklyGoal: user.stats.weeklyGoal
    });
  } catch (error) {
    console.error('Error updating weekly goal:', error);
    res.status(500).json({ error: 'Failed to update weekly goal' });
  }
});

// Get leaderboard
router.get('/leaderboard', optionalAuth, async (req, res) => {
  try {
    const { type = 'xp', limit = 10 } = req.query;
    
    let sortField;
    switch (type) {
      case 'xp':
        sortField = 'stats.experiencePoints';
        break;
      case 'streak':
        sortField = 'stats.streak';
        break;
      case 'completed':
        sortField = 'stats.totalCompleted';
        break;
      case 'roadmaps':
        sortField = 'stats.roadmapsCompleted';
        break;
      default:
        sortField = 'stats.experiencePoints';
    }

    const users = await User.find({})
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .select('name email profileImage stats activeLearningDays')
      .lean();

    // Add ranking
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      stats: user.stats,
      isCurrentUser: req.user ? user._id.toString() === req.user._id.toString() : false
    }));

    // If current user is authenticated and not in top results, add their position
    let currentUserRank = null;
    if (req.user && !leaderboard.some(u => u.isCurrentUser)) {
      const userRank = await User.countDocuments({
        [sortField]: { $gt: req.user.stats[sortField.split('.')[1]] }
      });
      currentUserRank = userRank + 1;
    }

    res.json({
      type,
      leaderboard,
      currentUserRank
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get user profile (public)
router.get('/:userId/profile', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name email bio location githubUsername twitterUsername stats activeLearningDays createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's public roadmaps
    const roadmaps = await Roadmap.find({ 
      createdBy: req.params.userId, 
      isPublic: true 
    })
    .select('title description difficulty progress likes views createdAt')
    .sort({ createdAt: -1 })
    .limit(6);

    // Get user's achievements
    const achievements = await UserAchievement.find({ 
      userId: req.params.userId,
      isCompleted: true 
    })
    .populate('achievementId')
    .sort({ earnedAt: -1 })
    .limit(10);

    const profile = {
      ...user,
      roadmaps,
      achievements: achievements.map(ua => ({
        title: ua.achievementId.title,
        description: ua.achievementId.description,
        icon: ua.achievementId.icon,
        difficulty: ua.achievementId.difficulty,
        earnedAt: ua.earnedAt
      })),
      isOwnProfile: req.user ? req.user._id.toString() === req.params.userId : false
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Search users
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name email profileImage stats.level stats.experiencePoints')
    .limit(parseInt(limit))
    .lean();

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // Get user's roadmaps
    const roadmaps = await Roadmap.find({ createdBy: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(5);

    // Get recent achievements
    const recentAchievements = await UserAchievement.find({ 
      userId: req.user._id,
      isCompleted: true 
    })
    .populate('achievementId')
    .sort({ earnedAt: -1 })
    .limit(3);

    // Get progress data
    const progress = await Progress.findOne({ userId: req.user._id });

    const dashboardData = {
      user: {
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        stats: user.stats,
        preferences: user.preferences
      },
      roadmaps: {
        recent: roadmaps,
        total: roadmaps.length,
        completed: roadmaps.filter(r => r.progress === 100).length
      },
      achievements: recentAchievements.map(ua => ({
        title: ua.achievementId.title,
        description: ua.achievementId.description,
        earnedAt: ua.earnedAt
      })),
      activity: {
        currentStreak: progress?.currentStreak || 0,
        totalContributions: progress?.totalContributions || 0,
        recentActivity: progress?.activities.slice(-7) || []
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
