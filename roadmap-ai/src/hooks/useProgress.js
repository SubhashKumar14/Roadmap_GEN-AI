import { useState, useEffect } from 'react'
import { useAuth } from './useAuth.js'
import { progressService } from '../services/progressService.js'
import { useWebSocket } from './useWebSocket.js'

export const useProgress = (roadmapId = null) => {
  const { user } = useAuth()
  const [progressData, setProgressData] = useState({
    summary: null,
    contributionData: [],
    entries: [],
    loading: true,
    error: null
  })

  // WebSocket for real-time updates
  const { } = useWebSocket(user?.id, (message) => {
    if (message.type === 'progress_updated') {
      // Refresh progress data when updates come in
      if (!roadmapId || message.data.roadmapId === roadmapId) {
        loadProgressData()
      }
    }
  })

  useEffect(() => {
    if (user) {
      loadProgressData()
    }
  }, [user, roadmapId])

  const loadProgressData = async () => {
    if (!user) return

    try {
      setProgressData(prev => ({ ...prev, loading: true, error: null }))

      const [summary, contributionData, entries] = await Promise.all([
        progressService.getProgressSummary(user.id),
        progressService.getContributionData(user.id),
        roadmapId ? progressService.getUserProgress(user.id, roadmapId) : Promise.resolve([])
      ])

      setProgressData({
        summary: summary.stats,
        contributionData: contributionData.contributionData,
        entries: entries || [],
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error loading progress data:', error)
      setProgressData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
    }
  }

  const toggleTask = async (roadmapId, moduleId, taskId, taskTitle, difficulty, completed) => {
    try {
      await progressService.toggleTaskCompletion(
        user.id,
        roadmapId,
        moduleId,
        taskId,
        taskTitle,
        difficulty,
        completed
      )

      // Optimistically update local state
      if (completed) {
        setProgressData(prev => ({
          ...prev,
          summary: prev.summary ? {
            ...prev.summary,
            totalTasks: (prev.summary.totalTasks || 0) + 1,
            problemsDistribution: {
              ...prev.summary.problemsDistribution,
              [difficulty]: (prev.summary.problemsDistribution[difficulty] || 0) + 1
            }
          } : prev.summary
        }))
      }

      return true
    } catch (error) {
      console.error('Error toggling task:', error)
      throw error
    }
  }

  const refreshData = () => {
    loadProgressData()
  }

  return {
    ...progressData,
    toggleTask,
    refreshData
  }
}

export const useContributionCalendar = (year = new Date().getFullYear()) => {
  const { user } = useAuth()
  const [calendarData, setCalendarData] = useState({
    contributionData: [],
    totalContributions: 0,
    currentStreak: 0,
    loading: true
  })

  useEffect(() => {
    if (user) {
      loadCalendarData()
    }
  }, [user, year])

  const loadCalendarData = async () => {
    try {
      const data = await progressService.getContributionData(user.id, year)
      const totalContributions = data.contributionData.reduce((sum, day) => sum + day.count, 0)
      
      // Calculate current streak
      const currentStreak = calculateStreak(data.contributionData)

      setCalendarData({
        contributionData: data.contributionData,
        totalContributions,
        currentStreak,
        loading: false
      })
    } catch (error) {
      console.error('Error loading calendar data:', error)
      setCalendarData(prev => ({ ...prev, loading: false }))
    }
  }

  return {
    ...calendarData,
    refreshCalendar: loadCalendarData
  }
}

// Helper function to calculate current streak
function calculateStreak(contributionData) {
  if (!contributionData.length) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let streak = 0
  let currentDate = new Date(today)

  // Sort by date descending
  const sortedData = contributionData
    .filter(day => day.count > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  for (const day of sortedData) {
    const dayDate = new Date(day.date)
    dayDate.setHours(0, 0, 0, 0)
    
    const diffDays = Math.floor((currentDate - dayDate) / (1000 * 60 * 60 * 24))
    
    if (diffDays === streak) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}
