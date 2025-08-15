import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import UserService from '../models/UserService.js';
import ProgressService from '../models/ProgressService.js';

const router = express.Router();

// Get real user stats (NO MOCK DATA)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const realStats = await ProgressService.getUserStatsSummary(req.user.id);
    
    console.log(`📊 Real user stats for ${req.user.id}:`, {
      level: realStats.level,
      experiencePoints: realStats.experiencePoints,
      totalCompleted: realStats.totalCompleted,
      streak: realStats.streak
    });
    
    res.json(realStats);
  } catch (error) {
    console.error('Error fetching real user stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update real user preferences (NO MOCK DATA)
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Valid preferences object required' });
    }
    
    // Get current user to merge preferences
    const currentUser = await UserService.findById(req.user.id);
    const updatedPreferences = {
      ...currentUser.preferences,
      ...preferences
    };
    
    const updatedUser = await UserService.updateProfile(req.user.id, {
      preferences: updatedPreferences
    });
    
    console.log(`⚙️  Real preferences updated for user ${req.user.id}`);
    
    res.json({
      preferences: updatedUser.preferences,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update real learning goals (NO MOCK DATA)
router.put('/learning-goals', authenticateToken, async (req, res) => {
  try {
    const { learningGoals } = req.body;
    
    if (!Array.isArray(learningGoals)) {
      return res.status(400).json({ error: 'Learning goals must be an array' });
    }
    
    const updatedUser = await UserService.updateProfile(req.user.id, {
      learning_goals: learningGoals
    });
    
    console.log(`🎯 Real learning goals updated for user ${req.user.id}:`, learningGoals.length, 'goals');
    
    res.json({
      learningGoals: updatedUser.learning_goals,
      message: 'Learning goals updated successfully'
    });
  } catch (error) {
    console.error('Error updating learning goals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update real weekly goal (NO MOCK DATA)
router.put('/weekly-goal', authenticateToken, async (req, res) => {
  try {
    const { weeklyGoal } = req.body;
    
    if (!weeklyGoal || weeklyGoal < 1 || weeklyGoal > 100) {
      return res.status(400).json({ error: 'Weekly goal must be between 1 and 100' });
    }
    
    // Get current stats and update weekly goal
    const currentUser = await UserService.findById(req.user.id);
    const updatedStats = {
      ...currentUser.stats,
      weeklyGoal: parseInt(weeklyGoal)
    };
    
    await UserService.updateStats(req.user.id, updatedStats);
    
    console.log(`📈 Real weekly goal updated for user ${req.user.id}:`, weeklyGoal);
    
    res.json({
      weeklyGoal: updatedStats.weeklyGoal,
      message: 'Weekly goal updated successfully'
    });
  } catch (error) {
    console.error('Error updating weekly goal:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get real leaderboard (NO MOCK DATA)
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'xp', limit = 10 } = req.query;
    
    let orderField = 'stats->experiencePoints';
    switch (type) {
      case 'streak':
        orderField = 'stats->streak';
        break;
      case 'completed':
        orderField = 'stats->totalCompleted';
        break;
      case 'roadmaps':
        orderField = 'stats->roadmapsCompleted';
        break;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('id, name, profile_image, stats')
      .order(orderField, { ascending: false })
      .limit(parseInt(limit));
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    const leaderboard = data.map((user, index) => ({
      id: user.id,
      name: user.name,
      profileImage: user.profile_image,
      stats: user.stats,
      rank: index + 1
    }));
    
    console.log(`🏆 Real leaderboard (${type}) fetched:`, leaderboard.length, 'users');
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching real leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get real user profile (NO MOCK DATA)
router.get('/:userId/profile', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await UserService.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's real stats and achievements
    const [realStats, realAchievements] = await Promise.all([
      ProgressService.getUserStatsSummary(userId),
      ProgressService.getUserAchievements(userId)
    ]);
    
    const profile = {
      id: user.id,
      name: user.name,
      bio: user.bio,
      location: user.location,
      profileImage: user.profile_image,
      githubUsername: user.github_username,
      twitterUsername: user.twitter_username,
      learningGoals: user.learning_goals,
      stats: realStats,
      achievements: realAchievements,
      joinedAt: user.created_at
    };
    
    console.log(`👤 Real profile fetched for user ${userId}`);
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching real user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search real users (NO MOCK DATA)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('id, name, profile_image, bio, stats')
      .or(`name.ilike.%${query}%, bio.ilike.%${query}%`)
      .limit(parseInt(limit));
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    const searchResults = data.map(user => ({
      id: user.id,
      name: user.name,
      profileImage: user.profile_image,
      bio: user.bio,
      level: user.stats?.level || 1,
      experiencePoints: user.stats?.experiencePoints || 0
    }));
    
    console.log(`🔍 Real user search for "${query}":`, searchResults.length, 'results');
    
    res.json(searchResults);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
