import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/authMiddleware.js';
import RoadmapService from '../models/RoadmapService.js';
import AIService from '../services/AIService.js';

const router = express.Router();

// Validation middleware
const validateRoadmapCreation = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters')
];

// Create roadmap endpoint (from AI generation)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const roadmapData = req.body;
    
    // Add roadmap ID if not present
    if (!roadmapData.id) {
      roadmapData.id = Math.random().toString(36).substr(2, 9);
    }
    
    const roadmap = await RoadmapService.createRoadmap(req.user.id, roadmapData);
    
    console.log(`✅ Roadmap created for user ${req.user.id}:`, roadmap.title);
    
    res.status(201).json(roadmap);
  } catch (error) {
    console.error('Error creating roadmap:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's roadmaps
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const roadmaps = await RoadmapService.getUserRoadmaps(req.user.id);
    res.json(roadmaps);
  } catch (error) {
    console.error('Error fetching user roadmaps:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific roadmap
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const roadmap = await RoadmapService.getRoadmapById(req.params.id);
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }
    
    // Check if user has access (owner or public roadmap)
    if (roadmap.user_id !== req.user.id && !roadmap.is_public) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(roadmap);
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update roadmap progress
router.put('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { moduleId, taskId, completed, timeSpent = 0 } = req.body;
    const roadmapId = req.params.id;
    
    // Get current roadmap
    const roadmap = await RoadmapService.getRoadmapById(roadmapId);
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }
    
    if (roadmap.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update the specific task in modules
    const updatedModules = roadmap.modules.map(module => {
      if (module.id === moduleId) {
        const updatedTasks = module.tasks.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              completed,
              completedAt: completed ? new Date().toISOString() : undefined
            };
          }
          return task;
        });
        return { ...module, tasks: updatedTasks };
      }
      return module;
    });
    
    // Calculate new progress percentage
    const totalTasks = updatedModules.reduce((total, module) => total + module.tasks.length, 0);
    const completedTasks = updatedModules.reduce((total, module) => 
      total + module.tasks.filter(task => task.completed).length, 0
    );
    const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Update roadmap with new modules and progress
    await RoadmapService.updateModules(roadmapId, updatedModules);
    const updatedRoadmap = await RoadmapService.updateProgress(roadmapId, newProgress);
    
    console.log(`📊 Progress updated for roadmap ${roadmapId}: ${newProgress}%`);
    
    res.json({
      roadmap: updatedRoadmap,
      taskUpdate: {
        moduleId,
        taskId,
        completed,
        timeSpent
      }
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get public roadmaps for browsing
router.get('/public/browse', async (req, res) => {
  try {
    const { limit = 20, offset = 0, category } = req.query;
    
    const roadmaps = await RoadmapService.getPublicRoadmaps(
      parseInt(limit),
      parseInt(offset),
      category
    );
    
    res.json(roadmaps);
  } catch (error) {
    console.error('Error fetching public roadmaps:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle roadmap visibility
router.put('/:id/visibility', authenticateToken, async (req, res) => {
  try {
    const { isPublic } = req.body;
    const roadmapId = req.params.id;
    
    const updatedRoadmap = await RoadmapService.toggleVisibility(
      roadmapId,
      req.user.id,
      isPublic
    );
    
    res.json(updatedRoadmap);
  } catch (error) {
    console.error('Error updating visibility:', error);
    res.status(500).json({ error: error.message });
  }
});

// Like/unlike roadmap
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const roadmapId = req.params.id;
    
    const result = await RoadmapService.toggleLike(roadmapId, req.user.id);
    
    res.json(result);
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fork roadmap
router.post('/:id/fork', authenticateToken, async (req, res) => {
  try {
    const roadmapId = req.params.id;
    
    const forkedRoadmap = await RoadmapService.forkRoadmap(roadmapId, req.user.id);
    
    console.log(`🍴 Roadmap ${roadmapId} forked by user ${req.user.id}`);
    
    res.status(201).json(forkedRoadmap);
  } catch (error) {
    console.error('Error forking roadmap:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete roadmap
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const roadmapId = req.params.id;
    
    const deletedRoadmap = await RoadmapService.deleteRoadmap(roadmapId, req.user.id);
    
    console.log(`🗑️  Roadmap ${roadmapId} deleted by user ${req.user.id}`);
    
    res.json({ message: 'Roadmap deleted successfully', roadmap: deletedRoadmap });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
