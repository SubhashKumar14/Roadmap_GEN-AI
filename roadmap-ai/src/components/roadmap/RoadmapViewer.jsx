import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useWebSocket } from '../../hooks/useWebSocket.js'
import { Button } from '../ui/Button.jsx'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.jsx'
import { Progress } from '../ui/Progress.jsx'
import { Badge } from '../ui/Badge.jsx'
import * as Checkbox from '@radix-ui/react-checkbox'
import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown, ChevronRight, Check, ArrowLeft, Clock, Target, PlayCircle, BookOpen } from 'lucide-react'
import { progressService } from '../../services/progressService.js'
import { db } from '../../lib/supabase.js'
import toast from 'react-hot-toast'

const RoadmapViewer = ({ roadmap, onBack }) => {
  const { user } = useAuth()
  const [expandedModules, setExpandedModules] = useState(new Set([0]))
  const [completedTasks, setCompletedTasks] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [roadmapData, setRoadmapData] = useState(roadmap)

  // WebSocket for real-time progress updates
  const { updateProgress } = useWebSocket(user?.id, (message) => {
    if (message.type === 'progress_updated' && message.data.roadmapId === roadmap.id) {
      // Update local state based on WebSocket message
      const { moduleId, taskId, completed } = message.data
      const taskKey = `${moduleId}-${taskId}`
      
      setCompletedTasks(prev => {
        const newSet = new Set(prev)
        if (completed) {
          newSet.add(taskKey)
        } else {
          newSet.delete(taskKey)
        }
        return newSet
      })
    }
  })

  // Load user's progress for this roadmap
  useEffect(() => {
    if (user && roadmap) {
      loadProgress()
    }
  }, [user, roadmap])

  const loadProgress = async () => {
    try {
      const progress = await db.getUserProgress(user.id, roadmap.id)
      const completed = new Set(
        progress.map(entry => `${entry.module_id}-${entry.task_id}`)
      )
      setCompletedTasks(completed)
    } catch (error) {
      console.error('Error loading progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = (moduleIndex) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleIndex)) {
        newSet.delete(moduleIndex)
      } else {
        newSet.add(moduleIndex)
      }
      return newSet
    })
  }

  const handleTaskToggle = async (moduleId, taskId, task, isCompleted) => {
    const taskKey = `${moduleId}-${taskId}`
    
    try {
      // Update local state immediately for better UX
      setCompletedTasks(prev => {
        const newSet = new Set(prev)
        if (isCompleted) {
          newSet.add(taskKey)
        } else {
          newSet.delete(taskKey)
        }
        return newSet
      })

      // Send WebSocket update for real-time sync
      updateProgress(
        roadmap.id,
        moduleId,
        taskId,
        isCompleted,
        task.title,
        task.difficulty || 'medium'
      )

      toast.success(isCompleted ? 'Task completed! 🎉' : 'Task marked incomplete')
    } catch (error) {
      // Revert local state on error
      setCompletedTasks(prev => {
        const newSet = new Set(prev)
        if (isCompleted) {
          newSet.delete(taskKey)
        } else {
          newSet.add(taskKey)
        }
        return newSet
      })
      
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'theory': return BookOpen
      case 'practice': return Target
      case 'project': return PlayCircle
      default: return Target
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!roadmap?.roadmap_data?.modules) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No roadmap data found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    )
  }

  const modules = roadmap.roadmap_data.modules
  const totalTasks = modules.reduce((sum, module) => sum + (module.tasks?.length || 0), 0)
  const completedCount = completedTasks.size
  const progressPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{roadmap.title}</h1>
          <p className="text-gray-600 mt-1">{roadmap.description}</p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Progress</span>
            <span className="text-2xl font-bold text-blue-600">{Math.round(progressPercentage)}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="h-3 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{completedCount}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{totalTasks - completedCount}</div>
              <div className="text-sm text-gray-500">Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{modules.length}</div>
              <div className="text-sm text-gray-500">Modules</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{roadmap.duration_weeks}w</div>
              <div className="text-sm text-gray-500">Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <div className="space-y-4">
        {modules.map((module, moduleIndex) => {
          const isExpanded = expandedModules.has(moduleIndex)
          const moduleTasks = module.tasks || []
          const moduleCompletedCount = moduleTasks.filter(task => 
            completedTasks.has(`${module.id}-${task.id}`)
          ).length
          const moduleProgress = moduleTasks.length > 0 ? (moduleCompletedCount / moduleTasks.length) * 100 : 0

          return (
            <Card key={module.id || moduleIndex} className="overflow-hidden">
              <Collapsible.Root open={isExpanded} onOpenChange={() => toggleModule(moduleIndex)}>
                <Collapsible.Trigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                        <div>
                          <CardTitle className="text-left">
                            {module.title}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {module.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{Math.round(moduleProgress)}%</div>
                        <div className="text-xs text-gray-500">
                          {moduleCompletedCount} / {moduleTasks.length}
                        </div>
                      </div>
                    </div>
                    <Progress value={moduleProgress} className="mt-2" />
                  </CardHeader>
                </Collapsible.Trigger>

                <Collapsible.Content>
                  <CardContent className="pt-0">
                    <div className="border-t pt-4"></div>
                    
                    <div className="space-y-3">
                      {moduleTasks.map((task) => {
                        const taskKey = `${module.id}-${task.id}`
                        const isCompleted = completedTasks.has(taskKey)
                        const TypeIcon = getTypeIcon(task.type)

                        return (
                          <div
                            key={task.id}
                            className={`p-4 border rounded-lg transition-all ${
                              isCompleted 
                                ? 'bg-green-50 border-green-200 task-completed' 
                                : 'hover:bg-gray-50 task-pending'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <Checkbox.Root
                                className="flex h-5 w-5 appearance-none items-center justify-center rounded border border-gray-300 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 mt-0.5"
                                checked={isCompleted}
                                onCheckedChange={(checked) => 
                                  handleTaskToggle(module.id, task.id, task, checked)
                                }
                              >
                                <Checkbox.Indicator className="text-white">
                                  <Check className="h-3 w-3" />
                                </Checkbox.Indicator>
                              </Checkbox.Root>

                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                                    {task.title}
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    {task.type && (
                                      <Badge variant="outline" className="text-xs">
                                        <TypeIcon className="w-3 h-3 mr-1" />
                                        {task.type}
                                      </Badge>
                                    )}
                                    {task.difficulty && (
                                      <Badge className={`text-xs ${getDifficultyColor(task.difficulty)}`}>
                                        {task.difficulty}
                                      </Badge>
                                    )}
                                    {task.estimatedMinutes && (
                                      <Badge variant="outline" className="text-xs">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {task.estimatedMinutes}m
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {task.description && (
                                  <p className={`text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {task.description}
                                  </p>
                                )}

                                {task.resources && (
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    {task.resources.articles?.map((article, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs cursor-pointer hover:bg-gray-100">
                                        📄 {article}
                                      </Badge>
                                    ))}
                                    {task.resources.videos?.map((video, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs cursor-pointer hover:bg-gray-100">
                                        🎥 {video}
                                      </Badge>
                                    ))}
                                    {task.resources.practice?.map((practice, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs cursor-pointer hover:bg-gray-100">
                                        💻 {practice}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {moduleProgress === 100 && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 font-medium">
                          🎉 Module completed! Great job on finishing all tasks.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Collapsible.Content>
              </Collapsible.Root>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default RoadmapViewer
