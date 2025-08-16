import WebSocket, { WebSocketServer } from 'ws'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const wss = new WebSocketServer({ port: process.env.PORT || 8080 })

const clients = new Map() // userId -> WebSocket connection

console.log('🚀 WebSocket server started on port', process.env.PORT || 8080)

wss.on('connection', (ws) => {
  console.log('New WebSocket connection')

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message)
      console.log('Received:', data)

      switch (data.type) {
        case 'auth':
          handleAuth(ws, data)
          break
        case 'progress_update':
          await handleProgressUpdate(data)
          break
        case 'roadmap_created':
          await handleRoadmapCreated(data)
          break
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }))
          break
        default:
          console.log('Unknown message type:', data.type)
      }
    } catch (error) {
      console.error('Error handling message:', error)
    }
  })

  ws.on('close', () => {
    // Remove client from map
    for (const [userId, client] of clients.entries()) {
      if (client === ws) {
        clients.delete(userId)
        console.log(`User ${userId} disconnected`)
        break
      }
    }
  })
})

function handleAuth(ws, data) {
  const { userId } = data
  clients.set(userId, ws)
  console.log(`User ${userId} authenticated`)
  
  ws.send(JSON.stringify({
    type: 'auth_success',
    message: 'Connected to real-time updates'
  }))
}

async function handleProgressUpdate(data) {
  const { userId, roadmapId, moduleId, taskId, completed } = data

  try {
    // Update database
    if (completed) {
      await supabase
        .from('progress_entries')
        .insert({
          user_id: userId,
          roadmap_id: roadmapId,
          module_id: moduleId,
          task_id: taskId,
          task_title: data.taskTitle || 'Task',
          difficulty: data.difficulty || 'medium'
        })
    } else {
      await supabase
        .from('progress_entries')
        .delete()
        .eq('user_id', userId)
        .eq('roadmap_id', roadmapId)
        .eq('module_id', moduleId)
        .eq('task_id', taskId)
    }

    // Update daily progress
    const today = new Date().toISOString().split('T')[0]
    
    const { data: progressData, error } = await supabase
      .from('progress_entries')
      .select('id')
      .eq('user_id', userId)
      .gte('completed_at', today)
      .lt('completed_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    if (!error) {
      const tasksToday = progressData.length
      const contributionLevel = Math.min(4, Math.floor(tasksToday / 2))

      await supabase
        .from('daily_progress')
        .upsert({
          user_id: userId,
          date: today,
          tasks_completed: tasksToday,
          contribution_level: contributionLevel
        })
    }

    // Update roadmap progress
    const { data: roadmapProgress } = await supabase
      .from('progress_entries')
      .select('id')
      .eq('user_id', userId)
      .eq('roadmap_id', roadmapId)

    const { data: roadmapData } = await supabase
      .from('roadmaps')
      .select('roadmap_data')
      .eq('id', roadmapId)
      .single()

    if (roadmapData) {
      const totalTasks = roadmapData.roadmap_data.modules.reduce(
        (sum, module) => sum + (module.tasks?.length || 0), 0
      )
      const completedTasks = roadmapProgress?.length || 0
      const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      await supabase
        .from('roadmaps')
        .update({
          progress_percentage: progressPercentage,
          total_tasks: totalTasks,
          completed_tasks: completedTasks
        })
        .eq('id', roadmapId)
    }

    // Broadcast to user
    const userClient = clients.get(userId)
    if (userClient) {
      userClient.send(JSON.stringify({
        type: 'progress_updated',
        data: {
          roadmapId,
          moduleId,
          taskId,
          completed,
          tasksToday: progressData?.length || 0
        }
      }))
    }

  } catch (error) {
    console.error('Error updating progress:', error)
  }
}

async function handleRoadmapCreated(data) {
  const { userId, roadmap } = data
  
  // Broadcast to user
  const userClient = clients.get(userId)
  if (userClient) {
    userClient.send(JSON.stringify({
      type: 'roadmap_created',
      data: roadmap
    }))
  }
}

export default wss
