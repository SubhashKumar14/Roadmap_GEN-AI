import express from 'express';
import { body, validationResult } from 'express-validator';
import AIService from '../services/AIService.js';
import AuthService from '../services/AuthService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // limit each user to 5 AI requests per windowMs
  message: { error: 'Too many AI requests, please try again later' },
  keyGenerator: (req) => req.user?._id || req.ip
});

// Validation middleware
const validateRoadmapGeneration = [
  body('topic').trim().isLength({ min: 3, max: 200 }).withMessage('Topic must be between 3 and 200 characters'),
  body('aiProvider').optional().isIn(['openai', 'gemini', 'perplexity']).withMessage('Invalid AI provider'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level')
];

const validateTopicClassification = [
  body('topic').trim().isLength({ min: 3, max: 100 }).withMessage('Topic must be between 3 and 100 characters')
];

const validateChatMessage = [
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Message must be between 1 and 500 characters'),
  body('context').optional().isLength({ max: 1000 }).withMessage('Context must be less than 1000 characters')
];

// Generate roadmap endpoint
router.post('/generate-roadmap', authenticateToken, aiRateLimit, validateRoadmapGeneration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { topic, aiProvider, difficulty } = req.body;

    // Get user's API keys if available
    const userApiKeys = AuthService.getDecryptedApiKeys(req.user);

    console.log(`🎯 AI Roadmap Generation Request:`, {
      userId: req.user._id,
      topic,
      aiProvider,
      difficulty,
      hasUserKeys: Object.keys(userApiKeys).length > 0
    });

    const roadmap = await AIService.generateRoadmap(topic, aiProvider, userApiKeys);

    console.log(`✅ Roadmap generated successfully:`, {
      title: roadmap.title,
      modules: roadmap.modules?.length || 0,
      provider: roadmap.aiProvider
    });

    res.json(roadmap);
  } catch (error) {
    console.error('❌ Roadmap generation error:', error);

    // Handle specific API errors
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        error: 'AI service rate limit reached. Please add your API keys in the profile or try again later.' 
      });
    } else if (error.response?.status === 401) {
      return res.status(503).json({ 
        error: 'AI service configuration issue. Please try again later or add your API keys.' 
      });
    } else if (error.message?.includes('API key')) {
      return res.status(503).json({ 
        error: 'AI service temporarily unavailable. Please add your API keys in the profile.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate roadmap. Please try again.' 
    });
  }
});

// Classify topic endpoint (for AI provider recommendation)
router.post('/classify-topic', authenticateToken, validateTopicClassification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { topic } = req.body;
    const recommendedProvider = AIService.classifyTopic(topic);

    res.json({ 
      topic,
      recommendedProvider,
      confidence: 0.85, // Mock confidence score
      reasoning: `Based on the topic keywords, ${recommendedProvider} is best suited for this type of content.`
    });
  } catch (error) {
    console.error('Topic classification error:', error);
    res.status(500).json({ error: 'Failed to classify topic' });
  }
});

// Chat endpoint (for AI assistance)
router.post('/chat', authenticateToken, validateChatMessage, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { message, context } = req.body;
    const userApiKeys = AuthService.getDecryptedApiKeys(req.user);

    const response = await AIService.generateChatResponse(message, context, userApiKeys);

    res.json(response);
  } catch (error) {
    console.error('Chat response error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Get available AI providers and their status
router.get('/providers', authenticateToken, async (req, res) => {
  try {
    const userApiKeys = AuthService.getDecryptedApiKeys(req.user);
    
    const providers = [
      {
        id: 'openai',
        name: 'OpenAI GPT-4',
        description: 'Best for technical and programming topics',
        available: !!process.env.OPENAI_API_KEY,
        userConfigured: !!userApiKeys.openai,
        specialties: ['Programming', 'Technical', 'Algorithms', 'Data Structures']
      },
      {
        id: 'gemini',
        name: 'Google Gemini',
        description: 'Excellent for creative and design topics',
        available: !!process.env.GOOGLE_GEMINI_API_KEY,
        userConfigured: !!userApiKeys.gemini,
        specialties: ['Creative', 'Design', 'Arts', 'Content Creation']
      },
      {
        id: 'perplexity',
        name: 'Perplexity AI',
        description: 'Perfect for current trends and research',
        available: !!process.env.PERPLEXITY_API_KEY,
        userConfigured: !!userApiKeys.perplexity,
        specialties: ['Research', 'Current Trends', 'Market Analysis', 'News']
      }
    ];

    res.json({ providers });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ error: 'Failed to fetch provider information' });
  }
});

// Test AI provider connection
router.post('/test-provider', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.body;
    
    if (!['openai', 'gemini', 'perplexity'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const userApiKeys = AuthService.getDecryptedApiKeys(req.user);
    
    // Simple test prompt
    const testResponse = await AIService.generateChatResponse(
      'Hello, please respond with "Connection successful"',
      '',
      userApiKeys
    );

    res.json({ 
      provider,
      status: 'connected',
      testResponse: testResponse.response.substring(0, 100)
    });
  } catch (error) {
    console.error('Provider test error:', error);
    res.status(500).json({ 
      provider: req.body.provider,
      status: 'failed',
      error: error.message 
    });
  }
});

export default router;
