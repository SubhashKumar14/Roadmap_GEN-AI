import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useWebSocket } from '../../hooks/useWebSocket.js'
import { Button } from '../ui/Button.jsx'
import { Input } from '../ui/Input.jsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card.jsx'
import * as Select from '@radix-ui/react-select'
import { ChevronDown, Loader2, Brain, Sparkles, Search, ArrowLeft } from 'lucide-react'
import AIService from '../../services/aiService.js'
import { db } from '../../lib/supabase.js'
import toast from 'react-hot-toast'

const RoadmapGenerator = ({ onRoadmapCreated, onBack }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    topic: '',
    aiProvider: '',
    difficulty: 'intermediate',
    duration: 8
  })
  const [loading, setLoading] = useState(false)
  const [userApiKeys, setUserApiKeys] = useState([])

  // WebSocket for real-time updates
  const { notifyRoadmapCreated } = useWebSocket(user?.id, (message) => {
    if (message.type === 'roadmap_created') {
      onRoadmapCreated?.(message.data)
    }
  })

  // Load user's API keys
  useEffect(() => {
    if (user) {
      db.getApiKeys(user.id).then(setUserApiKeys).catch(console.error)
    }
  }, [user])

  const aiProviders = [
    {
      value: 'openai',
      label: 'OpenAI GPT-4',
      icon: Brain,
      description: 'Best for technical and programming topics',
      color: 'text-green-600'
    },
    {
      value: 'gemini',
      label: 'Google Gemini',
      icon: Sparkles,
      description: 'Excellent for creative and design topics',
      color: 'text-blue-600'
    },
    {
      value: 'perplexity',
      label: 'Perplexity AI',
      icon: Search,
      description: 'Perfect for current trends and research',
      color: 'text-purple-600'
    }
  ]

  const handleTopicChange = (topic) => {
    setFormData(prev => ({ ...prev, topic }))
    
    // Auto-suggest AI provider
    if (topic.length > 3 && !formData.aiProvider) {
      const suggested = AIService.classifyTopic(topic)
      setFormData(prev => ({ ...prev, aiProvider: suggested }))
    }
  }

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    if (!formData.aiProvider) {
      toast.error('Please select an AI provider')
      return
    }

    setLoading(true)
    try {
      // Generate roadmap using AI
      const roadmapData = await AIService.generateRoadmap(
        formData.topic,
        formData.aiProvider,
        formData.difficulty,
        formData.duration,
        userApiKeys
      )

      // Save to database
      const savedRoadmap = await db.createRoadmap(user.id, {
        title: roadmapData.title,
        description: roadmapData.description,
        ai_provider: formData.aiProvider,
        difficulty_level: formData.difficulty,
        duration_weeks: formData.duration,
        roadmap_data: roadmapData
      })

      toast.success('Roadmap generated successfully!')
      
      // Notify via WebSocket
      notifyRoadmapCreated(savedRoadmap)
      
      // Reset form
      setFormData({
        topic: '',
        aiProvider: '',
        difficulty: 'intermediate',
        duration: 8
      })

    } catch (error) {
      console.error('Error generating roadmap:', error)
      toast.error(error.message || 'Failed to generate roadmap')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      {onBack && (
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Generate AI Roadmap</h1>
            <p className="text-gray-600">Create your personalized learning path</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>AI Roadmap Generator</CardTitle>
          <CardDescription>
            Create a personalized learning roadmap in Striver A2Z DSA format using advanced AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Topic Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Learning Topic *</label>
            <Input
              placeholder="e.g., Data Structures & Algorithms, React Development, Machine Learning"
              value={formData.topic}
              onChange={(e) => handleTopicChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* AI Provider Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select AI Provider *</label>
            <div className="grid gap-3">
              {aiProviders.map((provider) => {
                const Icon = provider.icon
                const isSelected = formData.aiProvider === provider.value
                
                return (
                  <div
                    key={provider.value}
                    onClick={() => setFormData(prev => ({ ...prev, aiProvider: provider.value }))}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-6 w-6 ${provider.color}`} />
                      <div className="flex-1">
                        <h3 className="font-medium">{provider.label}</h3>
                        <p className="text-sm text-gray-500">{provider.description}</p>
                      </div>
                      {isSelected && (
                        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Difficulty & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty Level</label>
              <Select.Root value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <Select.Value placeholder="Select difficulty" />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="overflow-hidden bg-white rounded-md border shadow-lg z-50">
                    <Select.Viewport className="p-1">
                      <Select.Item value="beginner" className="flex items-center px-8 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded relative">
                        <Select.ItemText>Beginner</Select.ItemText>
                        <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                          <div className="h-1 w-1 bg-current rounded-full"></div>
                        </Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item value="intermediate" className="flex items-center px-8 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded relative">
                        <Select.ItemText>Intermediate</Select.ItemText>
                        <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                          <div className="h-1 w-1 bg-current rounded-full"></div>
                        </Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item value="advanced" className="flex items-center px-8 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded relative">
                        <Select.ItemText>Advanced</Select.ItemText>
                        <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                          <div className="h-1 w-1 bg-current rounded-full"></div>
                        </Select.ItemIndicator>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (weeks)</label>
              <Input
                type="number"
                min="1"
                max="52"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 8 }))}
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !formData.topic.trim() || !formData.aiProvider}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Roadmap...
              </>
            ) : (
              'Generate Roadmap'
            )}
          </Button>

          {/* Example Topics */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Popular Topics:</label>
            <div className="flex flex-wrap gap-2">
              {[
                'Data Structures & Algorithms',
                'Full-Stack Web Development',
                'Machine Learning',
                'System Design',
                'React.js Development',
                'Python Programming',
                'UI/UX Design',
                'DevOps Engineering'
              ].map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicChange(topic)}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RoadmapGenerator
