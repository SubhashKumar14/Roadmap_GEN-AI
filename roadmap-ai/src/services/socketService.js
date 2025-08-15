import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.userId = null;
  }

  connect(userId) {
    if (this.connected) return;

    this.userId = userId;
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to real-time server');
      this.connected = true;

      if (userId) {
        this.socket.emit('join-room', userId);
      }
    });

    this.socket.on('real-time-connected', (data) => {
      console.log('✅ Real-time updates enabled:', data.message);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from real-time server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Real-time connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
      this.userId = null;
    }
  }

  // Emit real progress updates (no mock data)
  emitProgressUpdate(data) {
    if (this.socket && this.connected) {
      console.log('📊 Emitting real progress update:', data);
      this.socket.emit('progress-update', {
        ...data,
        userId: this.userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Emit real roadmap sharing (no mock data)
  emitRoadmapShared(roadmapData) {
    if (this.socket && this.connected) {
      console.log('🗺️  Sharing real roadmap:', roadmapData.title);
      this.socket.emit('roadmap-shared', {
        ...roadmapData,
        sharedBy: this.userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Listen for real progress updates
  onProgressUpdate(callback) {
    if (this.socket) {
      this.socket.on('progress-updated', (data) => {
        console.log('📊 Received real progress update:', data);
        callback(data);
      });
    }
  }

  // Listen for real achievement notifications
  onAchievementEarned(callback) {
    if (this.socket) {
      this.socket.on('achievement-notification', (achievement) => {
        console.log('🏆 Received real achievement notification:', achievement.title);
        callback(achievement);
      });
    }
  }

  // Listen for real shared roadmaps
  onNewRoadmapShared(callback) {
    if (this.socket) {
      this.socket.on('new-roadmap-shared', (data) => {
        console.log('🗺️  Received real shared roadmap:', data.title);
        callback(data);
      });
    }
  }

  // Real-time AI roadmap generation
  emitRoadmapGenerationStarted(data) {
    if (this.socket && this.connected) {
      console.log('🤖 Starting real AI roadmap generation:', data.topic);
      this.socket.emit('roadmap-generation-started', data);
    }
  }

  onGenerationStatus(callback) {
    if (this.socket) {
      this.socket.on('generation-status', callback);
    }
  }

  emitRoadmapGenerationCompleted(roadmap) {
    if (this.socket && this.connected) {
      console.log('✅ Real AI roadmap generation completed:', roadmap.title);
      this.socket.emit('roadmap-generation-completed', roadmap);
    }
  }

  // Real-time streak updates
  emitStreakUpdate(streakData) {
    if (this.socket && this.connected) {
      console.log('🔥 Emitting real streak update:', streakData.streak);
      this.socket.emit('streak-updated', streakData);
    }
  }

  onStreakUpdate(callback) {
    if (this.socket) {
      this.socket.on('streak-notification', (data) => {
        console.log('🔥 Received real streak notification:', data.streak);
        callback(data);
      });
    }
  }

  // Remove event listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();
