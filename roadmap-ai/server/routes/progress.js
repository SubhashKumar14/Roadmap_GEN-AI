import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import ProgressService from '../models/ProgressService.js';
import UserService from '../models/UserService.js';

const router = express.Router();

// Get real user stats summary (NO MOCK DATA)
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const realStats = await ProgressService.getUserStatsSummary(req.user.id);
    
    console.log(`📊 Real stats fetched for user ${req.user.id}:`, {
      totalCompleted: realStats.totalCompleted,
      streak: realStats.streak,
      totalRoadmaps: realStats.totalRoadmaps
    });
    
    res.json(realStats);
  } catch (error) {
    console.error('Error fetching real user stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get real user activity for contribution calendar (NO MOCK DATA)
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const realActivity = await ProgressService.getUserActivity(req.user.id, year);
    
    console.log(`📅 Real activity data for user ${req.user.id}, year ${year}:`, 
      Object.keys(realActivity).length, 'active days');
    
    res.json(realActivity);
  } catch (error) {
    console.error('Error fetching real activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Log real user activity (NO MOCK DATA)
router.post('/activity', authenticateToken, async (req, res) => {
  try {
    const { type, count = 1 } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Activity type is required' });
    }
    
    // Log real activity
    const activity = await ProgressService.logActivity(req.user.id, type, { count });
    
    // Update user activity and streak with real data
    const updatedUser = await UserService.updateActivity(req.user.id);
    
    console.log(`✅ Real activity logged for user ${req.user.id}:`, type);
    
    res.json({
      activity,
      user: updatedUser,
      message: 'Real activity logged successfully'
    });
  } catch (error) {
    console.error('Error logging real activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check and award real achievements (NO MOCK DATA)
router.post('/check-achievements', authenticateToken, async (req, res) => {
  try {
    const newAchievements = await ProgressService.checkAndAwardAchievements(req.user.id);
    
    if (newAchievements.length > 0) {
      console.log(`🏆 Real achievements earned by user ${req.user.id}:`, 
        newAchievements.map(a => a.achievements.title));
    }
    
    res.json({
      newAchievements,
      message: newAchievements.length > 0 ? 
        `Earned ${newAchievements.length} real achievement(s)!` : 
        'No new achievements at this time'
    });
  } catch (error) {
    console.error('Error checking real achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get real user achievements (NO MOCK DATA)
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const realAchievements = await ProgressService.getUserAchievements(req.user.id);
    
    console.log(`🏆 Real achievements for user ${req.user.id}:`, realAchievements.length);
    
    res.json(realAchievements);
  } catch (error) {
    console.error('Error fetching real achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Record real task completion (NO MOCK DATA)
router.post('/task-complete', authenticateToken, async (req, res) => {
  try {
    const { roadmapId, moduleId, taskId, timeSpent = 0 } = req.body;
    
    if (!roadmapId || !moduleId || !taskId) {
      return res.status(400).json({ 
        error: 'roadmapId, moduleId, and taskId are required' 
      });
    }
    
    // Record real progress
    const progress = await ProgressService.recordTaskCompletion(
      req.user.id, 
      roadmapId, 
      moduleId, 
      taskId, 
      timeSpent
    );
    
    // Update real user stats
    const currentUser = await UserService.findById(req.user.id);
    const updatedStats = {
      ...currentUser.stats,
      totalCompleted: (currentUser.stats?.totalCompleted || 0) + 1,
      weeklyProgress: (currentUser.stats?.weeklyProgress || 0) + 1,
      experiencePoints: (currentUser.stats?.experiencePoints || 0) + 10,
      totalStudyTime: (currentUser.stats?.totalStudyTime || 0) + timeSpent
    };
    
    // Calculate new level based on real XP
    updatedStats.level = Math.floor(updatedStats.experiencePoints / 300) + 1;
    
    await UserService.updateStats(req.user.id, updatedStats);
    
    // Log real activity
    await ProgressService.logActivity(req.user.id, 'task_completed', {
      roadmapId,
      moduleId, 
      taskId,
      timeSpent
    });
    
    // Check for real achievements
    const newAchievements = await ProgressService.checkAndAwardAchievements(req.user.id);
    
    console.log(`✅ Real task completion recorded for user ${req.user.id}:`, {
      roadmapId,
      taskId,
      timeSpent,
      newXP: updatedStats.experiencePoints,
      newLevel: updatedStats.level
    });
    
    res.json({
      progress,
      stats: updatedStats,
      newAchievements,
      message: 'Real progress recorded successfully'
    });
  } catch (error) {
    console.error('Error recording real task completion:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
