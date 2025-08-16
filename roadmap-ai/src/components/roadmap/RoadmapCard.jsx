import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card.jsx'
import { Button } from '../ui/Button.jsx'
import { Progress } from '../ui/Progress.jsx'
import { Badge } from '../ui/Badge.jsx'
import { Calendar, Clock, Brain, Sparkles, Search, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

const RoadmapCard = ({ roadmap, onView, onDelete }) => {
  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'openai': return Brain
      case 'gemini': return Sparkles
      case 'perplexity': return Search
      default: return Brain
    }
  }

  const getProviderColor = (provider) => {
    switch (provider) {
      case 'openai': return 'text-green-600 bg-green-100'
      case 'gemini': return 'text-blue-600 bg-blue-100'
      case 'perplexity': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100'
      case 'intermediate': return 'text-yellow-600 bg-yellow-100'
      case 'advanced': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const ProviderIcon = getProviderIcon(roadmap.ai_provider)
  const progress = roadmap.progress_percentage || 0

  return (
    <Card className="hover:shadow-lg transition-all duration-200 card-hover">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">{roadmap.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {roadmap.description}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getProviderColor(roadmap.ai_provider)}>
              <ProviderIcon className="w-3 h-3 mr-1" />
              {roadmap.ai_provider.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="progress-bar" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{roadmap.completed_tasks || 0} completed</span>
            <span>{roadmap.total_tasks || 0} total tasks</span>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          <Badge className={getDifficultyColor(roadmap.difficulty_level)}>
            {roadmap.difficulty_level}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {roadmap.duration_weeks} weeks
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            {format(new Date(roadmap.created_at), 'MMM dd')}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => onView(roadmap)}
          className="flex-1 mr-2"
        >
          View Roadmap
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onDelete(roadmap.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

export default RoadmapCard
