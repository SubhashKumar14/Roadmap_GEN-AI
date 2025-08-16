import { db } from '../lib/supabase.js'
import websocketService from '../lib/websocket.js'

export const roadmapService = {
  // Create a new roadmap
  async createRoadmap(userId, roadmapData) {
    try {
      const roadmap = await db.createRoadmap(userId, roadmapData)
      
      // Calculate initial progress
      const totalTasks = roadmap.roadmap_data.modules.reduce(
        (sum, module) => sum + (module.tasks?.length || 0), 0
      )
      
      // Update roadmap with calculated values
      const updatedRoadmap = await db.supabase
        .from('roadmaps')
        .update({
          total_tasks: totalTasks,
          completed_tasks: 0,
          progress_percentage: 0
        })
        .eq('id', roadmap.id)
        .select()
        .single()
      
      // Notify via WebSocket
      websocketService.notifyRoadmapCreated(userId, updatedRoadmap.data)
      
      return updatedRoadmap.data || roadmap
    } catch (error) {
      console.error('Error creating roadmap:', error)
      throw error
    }
  },

  // Get roadmap with progress calculation
  async getRoadmapWithProgress(roadmapId, userId) {
    try {
      const [roadmap, progressEntries] = await Promise.all([
        db.getRoadmap(roadmapId),
        db.getUserProgress(userId, roadmapId)
      ])

      if (!roadmap) {
        throw new Error('Roadmap not found')
      }

      // Calculate progress
      const completedTaskIds = new Set(
        progressEntries.map(entry => `${entry.module_id}-${entry.task_id}`)
      )

      let totalTasks = 0
      let completedTasks = 0

      if (roadmap.roadmap_data?.modules) {
        roadmap.roadmap_data.modules.forEach(module => {
          if (module.tasks) {
            module.tasks.forEach(task => {
              totalTasks++
              const taskKey = `${module.id}-${task.id}`
              if (completedTaskIds.has(taskKey)) {
                completedTasks++
                task.completed = true
              }
            })
          }
        })
      }

      const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      return {
        ...roadmap,
        progress_percentage: progressPercentage,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        completedTaskIds: Array.from(completedTaskIds)
      }
    } catch (error) {
      console.error('Error getting roadmap with progress:', error)
      throw error
    }
  },

  // Update roadmap metadata
  async updateRoadmap(roadmapId, updates) {
    try {
      const { data, error } = await db.supabase
        .from('roadmaps')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', roadmapId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating roadmap:', error)
      throw error
    }
  },

  // Delete roadmap
  async deleteRoadmap(roadmapId, userId) {
    try {
      // First delete all progress entries
      await db.supabase
        .from('progress_entries')
        .delete()
        .eq('roadmap_id', roadmapId)
        .eq('user_id', userId)

      // Then delete the roadmap
      const { error } = await db.supabase
        .from('roadmaps')
        .delete()
        .eq('id', roadmapId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting roadmap:', error)
      throw error
    }
  },

  // Get roadmap statistics
  async getRoadmapStats(roadmapId, userId) {
    try {
      const [roadmap, progressEntries] = await Promise.all([
        db.getRoadmap(roadmapId),
        db.getUserProgress(userId, roadmapId)
      ])

      if (!roadmap || roadmap.user_id !== userId) {
        throw new Error('Roadmap not found')
      }

      // Calculate detailed stats
      const completedByDifficulty = {
        easy: 0,
        medium: 0,
        hard: 0
      }

      const totalByDifficulty = {
        easy: 0,
        medium: 0,
        hard: 0
      }

      let totalTimeSpent = 0
      const completionDates = []

      // Process progress entries
      progressEntries.forEach(entry => {
        const difficulty = entry.difficulty?.toLowerCase() || 'medium'
        completedByDifficulty[difficulty]++
        totalTimeSpent += entry.time_spent_minutes || 0
        completionDates.push(entry.completed_at)
      })

      // Process roadmap tasks
      if (roadmap.roadmap_data?.modules) {
        roadmap.roadmap_data.modules.forEach(module => {
          if (module.tasks) {
            module.tasks.forEach(task => {
              const difficulty = task.difficulty?.toLowerCase() || 'medium'
              totalByDifficulty[difficulty]++
            })
          }
        })
      }

      const totalTasks = Object.values(totalByDifficulty).reduce((a, b) => a + b, 0)
      const completedTasks = Object.values(completedByDifficulty).reduce((a, b) => a + b, 0)

      return {
        roadmapId,
        totalTasks,
        completedTasks,
        progressPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        completedByDifficulty,
        totalByDifficulty,
        totalTimeSpent,
        averageTimePerTask: completedTasks > 0 ? totalTimeSpent / completedTasks : 0,
        completionDates: completionDates.sort(),
        startDate: roadmap.created_at,
        lastActivityDate: completionDates.length > 0 ? completionDates[completionDates.length - 1] : null
      }
    } catch (error) {
      console.error('Error getting roadmap stats:', error)
      throw error
    }
  },

  // Search roadmaps
  async searchRoadmaps(userId, searchTerm, filters = {}) {
    try {
      let query = db.supabase
        .from('roadmaps')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      // Apply search term
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      // Apply filters
      if (filters.aiProvider) {
        query = query.eq('ai_provider', filters.aiProvider)
      }

      if (filters.difficulty) {
        query = query.eq('difficulty_level', filters.difficulty)
      }

      if (filters.status) {
        if (filters.status === 'completed') {
          query = query.eq('progress_percentage', 100)
        } else if (filters.status === 'in-progress') {
          query = query.gt('progress_percentage', 0).lt('progress_percentage', 100)
        } else if (filters.status === 'not-started') {
          query = query.eq('progress_percentage', 0)
        }
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at'
      const sortOrder = filters.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching roadmaps:', error)
      throw error
    }
  }
}
