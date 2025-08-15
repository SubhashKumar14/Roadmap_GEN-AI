import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Roadmap from '../models/Roadmap.js';
import User from '../models/User.js';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation middleware
const validateRoadmapCreation = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('modules').isArray({ min: 1 }).withMessage('At least one module is required'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty')
];

const validateProgressUpdate = [
  body('moduleId').notEmpty().withMessage('Module ID is required'),
  body('taskId').notEmpty().withMessage('Task ID is required'),
  body('completed').isBoolean().withMessage('Completed must be a boolean'),
  body('timeSpent').optional().isNumeric().withMessage('Time spent must be a number')
];

// Create roadmap endpoint
router.post('/', authenticateToken, validateRoadmapCreation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const roadmapData = {
      ...req.body,
      createdBy: req.user._id
    };

    const roadmap = new Roadmap(roadmapData);
    roadmap.calculateProgress();
    await roadmap.save();

    console.log(`✅ Roadmap created:`, {
      id: roadmap._id,
      title: roadmap.title,
      modules: roadmap.modules.length,
      user: req.user.email
    });

    res.status(201).json(roadmap);
  } catch (error) {
    console.error('❌ Roadmap creation error:', error);
    res.status(500).json({ error: 'Failed to create roadmap' });
  }
});

// Get user's roadmaps
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, difficulty } = req.query;
    
    const query = { createdBy: req.user._id };
    
    // Add filters
    if (status === 'completed') {
      query.progress = 100;
    } else if (status === 'in-progress') {
      query.progress = { $gt: 0, $lt: 100 };
    } else if (status === 'not-started') {
      query.progress = 0;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }

    const roadmaps = await Roadmap.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name email');

    console.log(`📊 Retrieved ${roadmaps.length} roadmaps for user ${req.user.email}`);

    res.json(roadmaps);
  } catch (error) {
    console.error('❌ Error fetching user roadmaps:', error);
    res.status(500).json({ error: 'Failed to fetch roadmaps' });
  }
});

// Get roadmap by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id)
      .populate('createdBy', 'name email profileImage');

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    // Check if user can access this roadmap
    if (!roadmap.isPublic && (!req.user || roadmap.createdBy._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Increment view count
    if (!req.user || roadmap.createdBy._id.toString() !== req.user._id.toString()) {
      roadmap.views += 1;
      await roadmap.save();
    }

    res.json(roadmap);
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    res.status(500).json({ error: 'Failed to fetch roadmap' });
  }
});

// Update roadmap progress
router.put('/:id/progress', authenticateToken, validateProgressUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { moduleId, taskId, completed, timeSpent = 0 } = req.body;

    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    // Find and update the task
    const module = roadmap.modules.find(m => m.id === moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const task = module.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const wasCompleted = task.completed;
    task.completed = completed;
    task.timeSpent = (task.timeSpent || 0) + timeSpent;

    if (completed && !wasCompleted) {
      task.completedAt = new Date();
    } else if (!completed && wasCompleted) {
      task.completedAt = undefined;
    }

    // Check if all tasks in module are completed
    const allTasksCompleted = module.tasks.every(t => t.completed);
    if (allTasksCompleted && !module.completed) {
      module.completed = true;
      module.completedAt = new Date();
    } else if (!allTasksCompleted && module.completed) {
      module.completed = false;
      module.completedAt = undefined;
    }

    // Recalculate progress
    roadmap.calculateProgress();
    await roadmap.save();

    // Update user stats
    if (completed && !wasCompleted) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: {
          'stats.totalCompleted': 1,
          'stats.weeklyProgress': 1,
          'stats.experiencePoints': 10,
          'stats.totalStudyTime': timeSpent
        }
      });

      // Update problem count by difficulty
      if (task.difficulty) {
        const difficultyField = `stats.problemsSolved.${task.difficulty.toLowerCase()}`;
        await User.findByIdAndUpdate(req.user._id, {
          $inc: {
            [difficultyField]: 1,
            'stats.problemsSolved.total': 1
          }
        });
      }

      console.log(`✅ Task completed:`, {
        roadmapId: roadmap._id,
        taskTitle: task.title,
        user: req.user.email,
        progress: roadmap.progress
      });
    } else if (!completed && wasCompleted) {
      // Decrease stats when unchecking
      await User.findByIdAndUpdate(req.user._id, {
        $inc: {
          'stats.totalCompleted': -1,
          'stats.weeklyProgress': -1,
          'stats.experiencePoints': -10,
          'stats.totalStudyTime': -timeSpent
        }
      });

      if (task.difficulty) {
        const difficultyField = `stats.problemsSolved.${task.difficulty.toLowerCase()}`;
        await User.findByIdAndUpdate(req.user._id, {
          $inc: {
            [difficultyField]: -1,
            'stats.problemsSolved.total': -1
          }
        });
      }
    }

    res.json({
      message: 'Progress updated successfully',
      roadmap,
      progress: roadmap.progress
    });
  } catch (error) {
    console.error('❌ Progress update error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Toggle roadmap visibility (public/private)
router.put('/:id/visibility', authenticateToken, async (req, res) => {
  try {
    const { isPublic } = req.body;
    
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    roadmap.isPublic = isPublic;
    await roadmap.save();

    res.json({
      message: `Roadmap is now ${isPublic ? 'public' : 'private'}`,
      roadmap
    });
  } catch (error) {
    console.error('Error updating roadmap visibility:', error);
    res.status(500).json({ error: 'Failed to update visibility' });
  }
});

// Fork roadmap
router.post('/:id/fork', authenticateToken, async (req, res) => {
  try {
    const originalRoadmap = await Roadmap.findById(req.params.id);

    if (!originalRoadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    if (!originalRoadmap.isPublic && originalRoadmap.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Cannot fork private roadmap' });
    }

    // Create a copy of the roadmap
    const forkedRoadmap = new Roadmap({
      ...originalRoadmap.toObject(),
      _id: undefined,
      id: `forked_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${originalRoadmap.title} (Fork)`,
      createdBy: req.user._id,
      forkedFrom: originalRoadmap._id,
      progress: 0,
      isPublic: false,
      likes: 0,
      views: 0,
      forks: 0,
      createdAt: undefined,
      updatedAt: undefined
    });

    // Reset all completion states
    forkedRoadmap.modules.forEach(module => {
      module.completed = false;
      module.completedAt = undefined;
      module.tasks.forEach(task => {
        task.completed = false;
        task.completedAt = undefined;
        task.timeSpent = 0;
      });
    });

    forkedRoadmap.calculateProgress();
    await forkedRoadmap.save();

    // Increment fork count on original
    originalRoadmap.forks += 1;
    await originalRoadmap.save();

    res.status(201).json(forkedRoadmap);
  } catch (error) {
    console.error('Error forking roadmap:', error);
    res.status(500).json({ error: 'Failed to fork roadmap' });
  }
});

// Like/unlike roadmap
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { action } = req.body; // 'like' or 'unlike'
    
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    if (action === 'like') {
      roadmap.likes += 1;
    } else if (action === 'unlike') {
      roadmap.likes = Math.max(0, roadmap.likes - 1);
    }

    await roadmap.save();

    res.json({
      message: `Roadmap ${action}d successfully`,
      likes: roadmap.likes
    });
  } catch (error) {
    console.error('Error updating roadmap likes:', error);
    res.status(500).json({ error: 'Failed to update likes' });
  }
});

// Get public roadmaps (browse/explore)
router.get('/public/browse', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      difficulty, 
      sortBy = 'recent',
      search 
    } = req.query;

    const query = { isPublic: true };

    // Add filters
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sort options
    let sort = {};
    switch (sortBy) {
      case 'popular':
        sort = { likes: -1, views: -1 };
        break;
      case 'recent':
        sort = { createdAt: -1 };
        break;
      case 'updated':
        sort = { updatedAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const roadmaps = await Roadmap.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name profileImage')
      .select('-modules.tasks'); // Exclude task details for performance

    const total = await Roadmap.countDocuments(query);

    res.json({
      roadmaps,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error browsing public roadmaps:', error);
    res.status(500).json({ error: 'Failed to fetch roadmaps' });
  }
});

// Delete roadmap
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    await Roadmap.findByIdAndDelete(req.params.id);

    res.json({ message: 'Roadmap deleted successfully' });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    res.status(500).json({ error: 'Failed to delete roadmap' });
  }
});

// Get roadmap analytics
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    const analytics = roadmap.getStats();
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching roadmap analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
