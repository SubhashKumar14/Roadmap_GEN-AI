import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AI Services
export const aiService = {
  generateRoadmap: async (topic, aiProvider = null, difficulty = null) => {
    const response = await api.post('/ai/generate-roadmap', { 
      topic, 
      aiProvider, 
      difficulty 
    });
    return response.data;
  },

  classifyTopic: async (topic) => {
    const response = await api.post('/ai/classify-topic', { topic });
    return response.data;
  },

  chat: async (message, context = '') => {
    const response = await api.post('/ai/chat', { message, context });
    return response.data;
  }
};

// Roadmap Services
export const roadmapService = {
  getUserRoadmaps: async () => {
    const response = await api.get('/roadmap/user');
    return response.data;
  },

  getRoadmap: async (roadmapId) => {
    const response = await api.get(`/roadmap/${roadmapId}`);
    return response.data;
  },

  updateProgress: async (roadmapId, moduleId, taskId, completed, timeSpent = 0) => {
    const response = await api.put(`/roadmap/${roadmapId}/progress`, {
      moduleId,
      taskId,
      completed,
      timeSpent
    });
    return response.data;
  },

  forkRoadmap: async (roadmapId) => {
    const response = await api.post(`/roadmap/${roadmapId}/fork`);
    return response.data;
  },

  getPublicRoadmaps: async (params = {}) => {
    const response = await api.get('/roadmap/public/browse', { params });
    return response.data;
  },

  toggleVisibility: async (roadmapId, isPublic) => {
    const response = await api.put(`/roadmap/${roadmapId}/visibility`, { isPublic });
    return response.data;
  },

  likeRoadmap: async (roadmapId, action) => {
    const response = await api.post(`/roadmap/${roadmapId}/like`, { action });
    return response.data;
  },

  deleteRoadmap: async (roadmapId) => {
    const response = await api.delete(`/roadmap/${roadmapId}`);
    return response.data;
  }
};

// User Services
export const userService = {
  getStats: async () => {
    const response = await api.get('/user/stats');
    return response.data;
  },

  updatePreferences: async (preferences) => {
    const response = await api.put('/user/preferences', preferences);
    return response.data;
  },

  updateLearningGoals: async (learningGoals) => {
    const response = await api.put('/user/learning-goals', { learningGoals });
    return response.data;
  },

  updateWeeklyGoal: async (weeklyGoal) => {
    const response = await api.put('/user/weekly-goal', { weeklyGoal });
    return response.data;
  },

  getLeaderboard: async (type = 'xp', limit = 10) => {
    const response = await api.get('/user/leaderboard', { 
      params: { type, limit } 
    });
    return response.data;
  },

  getUserProfile: async (userId) => {
    const response = await api.get(`/user/${userId}/profile`);
    return response.data;
  },

  searchUsers: async (query, limit = 10) => {
    const response = await api.get('/user/search', { 
      params: { q: query, limit } 
    });
    return response.data;
  }
};

// Progress Services
export const progressService = {
  getSummary: async () => {
    const response = await api.get('/progress/summary');
    return response.data;
  },

  getActivity: async (year = new Date().getFullYear()) => {
    const response = await api.get('/progress/activity', { 
      params: { year } 
    });
    return response.data;
  },

  addActivity: async (type, count = 1) => {
    const response = await api.post('/progress/activity', { type, count });
    return response.data;
  },

  checkAchievements: async () => {
    const response = await api.post('/progress/check-achievements');
    return response.data;
  },

  getAchievements: async () => {
    const response = await api.get('/progress/achievements');
    return response.data;
  }
};

export default api;
