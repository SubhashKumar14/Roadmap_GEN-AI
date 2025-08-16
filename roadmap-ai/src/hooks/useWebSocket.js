import { useEffect, useRef } from 'react'
import websocketService from '../lib/websocket.js'

export const useWebSocket = (userId, onMessage) => {
  const isConnected = useRef(false)

  useEffect(() => {
    if (userId && !isConnected.current) {
      websocketService.connect(userId)
      isConnected.current = true

      // Add message listener
      if (onMessage) {
        websocketService.on('progress_updated', onMessage)
        websocketService.on('roadmap_created', onMessage)
      }
    }

    return () => {
      if (onMessage) {
        websocketService.off('progress_updated', onMessage)
        websocketService.off('roadmap_created', onMessage)
      }
    }
  }, [userId, onMessage])

  return {
    send: (data) => websocketService.send(data),
    updateProgress: (roadmapId, moduleId, taskId, completed, taskTitle, difficulty) => 
      websocketService.updateProgress(userId, roadmapId, moduleId, taskId, completed, taskTitle, difficulty),
    notifyRoadmapCreated: (roadmap) => 
      websocketService.notifyRoadmapCreated(userId, roadmap)
  }
}
