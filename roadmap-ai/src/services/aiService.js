import axios from 'axios'

class AIService {
  constructor() {
    this.defaultKeys = {
      openai: import.meta.env.VITE_OPENAI_API_KEY,
      gemini: import.meta.env.VITE_GOOGLE_GEMINI_API_KEY,
      perplexity: import.meta.env.VITE_PERPLEXITY_API_KEY,
      youtube: import.meta.env.VITE_YOUTUBE_API_KEY
    }
  }

  // Decrypt user API key (simple base64 for demo)
  decryptApiKey(encryptedKey) {
    try {
      return atob(encryptedKey)
    } catch {
      return encryptedKey
    }
  }

  // Get API key (user's or default)
  getApiKey(provider, userKeys = []) {
    const userKey = userKeys.find(k => k.provider === provider)
    if (userKey?.api_key_encrypted) {
      return this.decryptApiKey(userKey.api_key_encrypted)
    }
    return this.defaultKeys[provider]
  }

  // Classify topic for AI recommendation
  classifyTopic(topic) {
    const topicLower = topic.toLowerCase()

    // Technical/Programming topics → OpenAI
    const openaiKeywords = [
      'programming', 'coding', 'software', 'development', 'algorithm', 
      'data structure', 'web', 'frontend', 'backend', 'javascript', 
      'python', 'react', 'node', 'api', 'database', 'sql', 'dsa',
      'competitive programming', 'leetcode', 'system design'
    ]

    // Creative/Design topics → Gemini
    const geminiKeywords = [
      'design', 'creative', 'art', 'ui', 'ux', 'graphics', 
      'content', 'writing', 'marketing', 'branding'
    ]

    // Research/Current topics → Perplexity
    const perplexityKeywords = [
      'research', 'analysis', 'trends', 'market', 'finance', 
      'news', 'current', 'industry', 'business'
    ]

    for (const keyword of openaiKeywords) {
      if (topicLower.includes(keyword)) return 'openai'
    }

    for (const keyword of geminiKeywords) {
      if (topicLower.includes(keyword)) return 'gemini'
    }

    for (const keyword of perplexityKeywords) {
      if (topicLower.includes(keyword)) return 'perplexity'
    }

    return 'openai' // Default
  }

  // Generate roadmap with selected AI
  async generateRoadmap(topic, aiProvider, difficulty, duration, userApiKeys = []) {
    const provider = aiProvider || this.classifyTopic(topic)
    
    try {
      let roadmap
      switch (provider) {
        case 'openai':
          roadmap = await this.generateWithOpenAI(topic, difficulty, duration, userApiKeys)
          break
        case 'gemini':
          roadmap = await this.generateWithGemini(topic, difficulty, duration, userApiKeys)
          break
        case 'perplexity':
          roadmap = await this.generateWithPerplexity(topic, difficulty, duration, userApiKeys)
          break
        default:
          roadmap = await this.generateWithOpenAI(topic, difficulty, duration, userApiKeys)
      }

      // Add metadata
      roadmap.ai_provider = provider
      roadmap.difficulty_level = difficulty
      roadmap.duration_weeks = duration
      roadmap.created_at = new Date().toISOString()

      return roadmap
    } catch (error) {
      console.error(`Error generating roadmap with ${provider}:`, error)
      throw new Error(`Failed to generate roadmap: ${error.message}`)
    }
  }

  // OpenAI implementation
  async generateWithOpenAI(topic, difficulty, duration, userApiKeys) {
    const apiKey = this.getApiKey('openai', userApiKeys)
    
    const prompt = `Create a comprehensive ${difficulty} level learning roadmap for "${topic}" spanning ${duration} weeks in Striver A2Z DSA sheet format.

Structure as JSON:
{
  "title": "Roadmap title",
  "description": "Brief description", 
  "modules": [
    {
      "id": "module-1",
      "title": "Module name",
      "description": "Module description",
      "estimatedHours": 20,
      "order": 1,
      "tasks": [
        {
          "id": "task-1",
          "title": "Task name",
          "description": "Task description",
          "difficulty": "easy|medium|hard",
          "estimatedMinutes": 45,
          "type": "theory|practice|project",
          "resources": {
            "articles": ["Article name"],
            "videos": ["Video title"],
            "practice": ["Platform/Problem"]
          },
          "order": 1
        }
      ]
    }
  ]
}

Create ${Math.ceil(duration/2)} modules with 4-8 tasks each. Make it comprehensive and practical.`

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    const content = response.data.choices[0].message.content
    try {
      return JSON.parse(content)
    } catch {
      throw new Error('Invalid JSON response from OpenAI')
    }
  }

  // Gemini implementation
  async generateWithGemini(topic, difficulty, duration, userApiKeys) {
    const apiKey = this.getApiKey('gemini', userApiKeys)
    
    const prompt = `Create a comprehensive ${difficulty} level learning roadmap for "${topic}" spanning ${duration} weeks in A2Z Striver format. Return only valid JSON with modules and tasks structure.`

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      }
    )

    const content = response.data.candidates[0].content.parts.text
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in response')
      return JSON.parse(jsonMatch[0])
    } catch {
      throw new Error('Invalid JSON response from Gemini')
    }
  }

  // Perplexity implementation
  async generateWithPerplexity(topic, difficulty, duration, userApiKeys) {
    const apiKey = this.getApiKey('perplexity', userApiKeys)
    
    const prompt = `Create a comprehensive ${difficulty} level learning roadmap for "${topic}" spanning ${duration} weeks in A2Z Striver DSA sheet format. Return only valid JSON.`

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
    })

    const content = response.data.choices[0].message.content
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in response')
      return JSON.parse(jsonMatch)
    } catch {
      throw new Error('Invalid JSON response from Perplexity')
    }
  }

  // Get YouTube videos for topic
  async getYouTubeVideos(query, maxResults = 3) {
    const apiKey = this.defaultKeys.youtube
    if (!apiKey) return []

    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${apiKey}`
      )

      return response.data.items.map(item => ({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.medium.url,
        channel: item.snippet.channelTitle
      }))
    } catch (error) {
      console.error('Error fetching YouTube videos:', error)
      return []
    }
  }
}

export default new AIService()
