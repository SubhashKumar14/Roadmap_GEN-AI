import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(userId) {
    if (this.connected) return;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to socket server');
      this.connected = true;
      
      if (userId) {
        this.socket.emit('join-room', userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from socket server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }

  // Emit progress update
  emitProgressUpdate(data) {
    if (this.socket && this.connected) {
      this.socket.emit('progress-update', data);
    }
  }

  // Emit roadmap shared
  emitRoadmapShared(roadmapData) {
    if (this.socket && this.connected) {
      this.socket.emit('roadmap-shared', roadmapData);
    }
  }

  // Listen for progress updates
  onProgressUpdate(callback) {
    if (this.socket) {
      this.socket.on('progress-updated', callback);
    }
  }

  // Listen for achievement earned
  onAchievementEarned(callback) {
    if (this.socket) {
      this.socket.on('achievement-earned', callback);
    }
  }

  // Listen for new shared roadmaps
  onNewRoadmapShared(callback) {
    if (this.socket) {
      this.socket.on('new-roadmap-shared', callback);
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
