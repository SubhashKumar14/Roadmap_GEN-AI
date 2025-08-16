class WebSocketService {
  constructor() {
    this.ws = null
    this.userId = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 1000
    this.listeners = new Map()
  }

  connect(userId) {
    this.userId = userId
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'
    
    try {
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected')
        this.reconnectAttempts = 0
        
        // Authenticate
        this.send({
          type: 'auth',
          userId: this.userId
        })

        // Start heartbeat
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('❌ WebSocket disconnected')
        this.stopHeartbeat()
        this.reconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

    } catch (error) {
      console.error('Error connecting to WebSocket:', error)
    }
  }

  disconnect() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  handleMessage(data) {
    console.log('📨 Received:', data)
    
    // Emit to listeners
    const listeners = this.listeners.get(data.type) || []
    listeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Error in listener:', error)
      }
    })
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    const listeners = this.listeners.get(event) || []
    const index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    setTimeout(() => {
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      this.connect(this.userId)
    }, this.reconnectInterval * this.reconnectAttempts)
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping' })
    }, 30000)
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Convenience methods
  updateProgress(userId, roadmapId, moduleId, taskId, completed, taskTitle, difficulty) {
    this.send({
      type: 'progress_update',
      userId,
      roadmapId,
      moduleId,
      taskId,
      completed,
      taskTitle,
      difficulty
    })
  }

  notifyRoadmapCreated(userId, roadmap) {
    this.send({
      type: 'roadmap_created',
      userId,
      roadmap
    })
  }
}

export default new WebSocketService()
