import { db } from '../lib/supabase.js'
import { format, startOfYear, endOfYear, eachDayOfInterval } from 'date-fns'
import websocketService from '../lib/websocket.js'

export const progressService = {
  // Toggle task completion with WebSocket update
  async toggleTaskCompletion(userId, roadmapId, moduleId, taskId, taskTitle, difficulty, completed) {
    try {
      // Send WebSocket update for real-time sync
      websocketService.updateProgress(
        userId, 
        roadmapId, 
        moduleId, 
        taskId, 
        completed, 
        taskTitle, 
        difficulty
      )

      return { success: true }
    } catch (error) {
      console.error('Error toggling task completion:', error)
      throw error
    }
  },

  // Get user's contribution calendar data
  async getContributionData(userId, year = new Date().getFullYear()) {
    try {
      const dailyProgress = await db.getDailyProgress(userId, year)
      
      // Create full year data
      const startDate = startOfYear(new Date(year, 0, 1))
      const endDate = endOfYear(new Date(year, 11, 31))
      const allDays = eachDayOfInterval({ start: startDate, end: endDate })

      // Create map of daily progress
      const progressMap = new Map()
      dailyProgress.forEach(day => {
        progressMap.set(day.date, day)
      })

      // Generate contribution data for all days
      const contributionData = allDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const dayProgress = progressMap.get(dateStr)
        
        return {
          date: dateStr,
          count: dayProgress?.tasks_completed || 0,
          level: dayProgress?.contribution_level || 0
        }
      })

      return {
        year,
        contributionData,
        totalContributions: dailyProgress.reduce((sum, day) => sum + day.tasks_completed, 0)
      }
    } catch (error) {
      console.error('Error getting contribution data:', error)
      throw error
    }
  },

  // Get user's progress summary
  async getProgressSummary(userId) {
    try {
      const profile = await db.getProfile(userId)
      const roadmaps = await db.getUserRoadmaps(userId)
      const progressEntries = await db.getUserProgress(userId)

      // Calculate stats
      const totalRoadmaps = roadmaps.length
      const completedRoadmaps = roadmaps.filter(r => r.progress_percentage === 100).length
      const totalTasks = progressEntries.length
      
      // Problem distribution
      const problemsDistribution = progressEntries.reduce((acc, entry) => {
        const diff = entry.difficulty || 'medium'
        acc[diff] = (acc[diff] || 0) + 1
        return acc
      }, { easy: 0, medium: 0, hard: 0 })

      return {
        profile: profile || {},
        stats: {
          totalRoadmaps,
          completedRoadmaps,
          totalTasks,
          problemsDistribution,
          currentStreak: profile?.current_streak || 0,
          totalXp: profile?.total_xp || 0,
          currentLevel: profile?.current_level || 1
        }
      }
    } catch (error) {
      console.error('Error getting progress summary:', error)
      throw error
    }
  }
}
