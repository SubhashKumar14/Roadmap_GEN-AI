import axios from 'axios';

class AIService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY;
  }

  // Classify topic to recommend best AI provider
  classifyTopic(topic) {
    const topicLower = topic.toLowerCase();

    // Technical/Programming topics → OpenAI
    const openaiKeywords = [
      'programming', 'coding', 'software', 'development', 'algorithm', 
      'data structure', 'web', 'frontend', 'backend', 'javascript', 
      'python', 'react', 'node', 'api', 'database', 'sql', 'mongodb', 
      'ai', 'machine learning', 'ml', 'dsa', 'leetcode', 'system design',
      'competitive programming', 'computer science'
    ];

    // Creative/Design topics → Gemini
    const geminiKeywords = [
      'design', 'creative', 'art', 'drawing', 'music', 'writing', 
      'content', 'video editing', 'photography', 'graphic design', 
      'ui design', 'ux design', 'animation', 'marketing', 'branding',
      'storytelling', 'creative writing'
    ];

    // Current/Research topics → Perplexity
    const perplexityKeywords = [
      'news', 'trends', 'market', 'cryptocurrency', 'blockchain', 
      'finance', 'research', 'academic', 'startup', 'business', 
      'seo', 'digital marketing', 'current events', 'analysis'
    ];

    for (const keyword of openaiKeywords) {
      if (topicLower.includes(keyword)) return 'openai';
    }

    for (const keyword of geminiKeywords) {
      if (topicLower.includes(keyword)) return 'gemini';
    }

    for (const keyword of perplexityKeywords) {
      if (topicLower.includes(keyword)) return 'perplexity';
    }

    return 'openai'; // Default to OpenAI
  }

  // Generate roadmap using specified AI provider
  async generateRoadmap(topic, aiProvider = null, userApiKeys = {}) {
    // Use user's preferred provider or classify topic
    const provider = aiProvider || this.classifyTopic(topic);
    
    console.log(`Generating roadmap for "${topic}" using ${provider.toUpperCase()}`);

    let roadmap;
    try {
      switch (provider) {
        case 'openai':
          roadmap = await this.generateWithOpenAI(topic, userApiKeys.openai);
          break;
        case 'gemini':
          roadmap = await this.generateWithGemini(topic, userApiKeys.gemini);
          break;
        case 'perplexity':
          roadmap = await this.generateWithPerplexity(topic, userApiKeys.perplexity);
          break;
        default:
          roadmap = await this.generateWithOpenAI(topic, userApiKeys.openai);
      }

      // Enhance with YouTube videos
      roadmap = await this.enhanceWithYouTubeVideos(roadmap);
      
      // Add metadata
      roadmap.id = this.generateId();
      roadmap.createdAt = new Date().toISOString();
      roadmap.progress = 0;
      roadmap.aiProvider = provider;

      return roadmap;
    } catch (error) {
      console.error(`Error generating roadmap with ${provider}:`, error);
      throw error;
    }
  }

  // OpenAI roadmap generation
  async generateWithOpenAI(topic, userApiKey = null) {
    const apiKey = userApiKey || this.openaiApiKey;
    
    const prompt = `Create a comprehensive learning roadmap for: "${topic}" in the format of TUF Striver's A2Z DSA sheet.

Structure your response as a JSON object with this exact format:
{
  "title": "Brief title for the roadmap",
  "description": "2-3 sentence description",
  "difficulty": "beginner|intermediate|advanced",
  "estimatedDuration": "X-Y weeks/months",
  "category": "Category (DSA/Development/Design/etc)",
  "modules": [
    {
      "id": "1",
      "title": "Module title",
      "description": "Module description",
      "completed": false,
      "difficulty": "Easy|Medium|Hard",
      "estimatedTime": "X hours",
      "order": 1,
      "tasks": [
        {
          "id": "1-1",
          "title": "Task title",
          "completed": false,
          "difficulty": "Easy|Medium|Hard",
          "type": "Theory|Practice|Project",
          "estimatedTime": "X minutes",
          "description": "Detailed task description",
          "learningObjectives": ["Objective 1", "Objective 2"],
          "prerequisites": ["Prerequisite 1"],
          "order": 1,
          "resources": {
            "articles": ["Article title"],
            "documentation": ["Doc link"],
            "practice": ["Platform/Problem name"],
            "youtubeSearch": "search query for YouTube videos"
          }
        }
      ]
    }
  ]
}

Make it comprehensive with 6-10 modules and 4-8 tasks per module. Include specific YouTube search queries for educational videos.`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    const content = response.data.choices[0].message.content;
    
    try {
      const roadmap = JSON.parse(content);
      return roadmap;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid response format from OpenAI');
    }
  }

  // Gemini roadmap generation
  async generateWithGemini(topic, userApiKey = null) {
    const apiKey = userApiKey || this.geminiApiKey;
    
    const prompt = `Create a comprehensive learning roadmap for: "${topic}" with creative and practical approaches in TUF Striver's A2Z DSA sheet format.

Structure your response as a JSON object focusing on creative learning approaches with 6-8 modules and hands-on projects. Use the same JSON structure as shown in the OpenAI prompt.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const content = response.data.candidates[0].content.parts.text;
    
    try {
      const roadmap = JSON.parse(content);
      return roadmap;
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', content);
      throw new Error('Invalid response format from Gemini');
    }
  }

  // Perplexity roadmap generation
  async generateWithPerplexity(topic, userApiKey = null) {
    const apiKey = userApiKey || this.perplexityApiKey;
    
    const prompt = `Create a comprehensive learning roadmap for: "${topic}" with current trends and up-to-date resources in TUF Striver's A2Z DSA sheet format.

Focus on the latest tools, current industry practices, and recent developments. Include 6-8 modules with current trends and research. Use the same JSON structure format.`;

    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0].message.content;
    
    try {
      const roadmap = JSON.parse(content);
      return roadmap;
    } catch (parseError) {
      console.error('Failed to parse Perplexity response:', content);
      throw new Error('Invalid response format from Perplexity');
    }
  }

  // Enhance roadmap with YouTube videos
  async enhanceWithYouTubeVideos(roadmap) {
    if (!this.youtubeApiKey) {
      console.log('YouTube API key not available, skipping video enhancement');
      return roadmap;
    }

    try {
      for (const module of roadmap.modules) {
        for (const task of module.tasks) {
          if (task.resources?.youtubeSearch) {
            const videos = await this.searchYouTubeVideos(task.resources.youtubeSearch);
            if (videos.length > 0) {
              task.resources.videos = videos;
              delete task.resources.youtubeSearch;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error enhancing with YouTube videos:', error);
    }

    return roadmap;
  }

  // Search YouTube videos
  async searchYouTubeVideos(query) {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=3&key=${this.youtubeApiKey}`
      );

      return response.data.items.map(item => ({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.medium.url,
        channel: item.snippet.channelTitle,
        duration: 'Medium'
      }));
    } catch (error) {
      console.error('Error searching YouTube videos:', error);
      return [];
    }
  }

  // Generate chat response
  async generateChatResponse(message, context = '', userApiKeys = {}) {
    // For simplicity, use OpenAI for chat responses
    const apiKey = userApiKeys.openai || this.openaiApiKey;
    
    const prompt = `${context ? `Context: ${context}` : ''}

User question: ${message}

Please provide a helpful response about learning and roadmaps.`;

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      return {
        response: response.data.choices[0].message.content,
        provider: 'openai'
      };
    } catch (error) {
      console.error('Error generating chat response:', error);
      throw error;
    }
  }

  // Generate unique ID
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

export default new AIService();
