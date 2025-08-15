import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  articles: [String],
  documentation: [String],
  practice: [String],
  videos: [{
    title: String,
    url: String,
    thumbnail: String,
    channel: String,
    duration: String
  }]
});

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: Date,
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  type: { type: String, enum: ['Theory', 'Practice', 'Project'], default: 'Practice' },
  estimatedTime: String, // e.g., "30 minutes"
  description: String,
  learningObjectives: [String],
  prerequisites: [String],
  resources: resourceSchema,
  notes: String,
  timeSpent: { type: Number, default: 0 }, // in minutes
  order: { type: Number, default: 0 }
});

const moduleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  completed: { type: Boolean, default: false },
  completedAt: Date,
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  estimatedTime: String, // e.g., "5 hours"
  tasks: [taskSchema],
  prerequisites: [String],
  order: { type: Number, default: 0 }
});

const roadmapSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  difficulty: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'], 
    default: 'intermediate' 
  },
  aiProvider: { 
    type: String, 
    enum: ['openai', 'gemini', 'perplexity'], 
    required: true 
  },
  estimatedDuration: String,
  progress: { type: Number, default: 0 },
  modules: [moduleSchema],
  
  // User who created this roadmap
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Metadata
  category: String,
  tags: [String],
  isPublic: { type: Boolean, default: false },
  isTemplate: { type: Boolean, default: false },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  forks: { type: Number, default: 0 },
  
  // Forked from another roadmap
  forkedFrom: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Roadmap' 
  },
  
  // Analytics
  analytics: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    averageTaskTime: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }
  },
  
  // DSA Sheet specific structure
  sheetStructure: {
    totalProblems: { type: Number, default: 0 },
    solvedProblems: { type: Number, default: 0 },
    easyCount: { type: Number, default: 0 },
    mediumCount: { type: Number, default: 0 },
    hardCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Calculate progress when tasks are updated
roadmapSchema.methods.calculateProgress = function() {
  let totalTasks = 0;
  let completedTasks = 0;
  let totalTimeSpent = 0;
  let easyCount = 0;
  let mediumCount = 0;
  let hardCount = 0;
  
  this.modules.forEach(module => {
    module.tasks.forEach(task => {
      totalTasks++;
      if (task.completed) {
        completedTasks++;
      }
      totalTimeSpent += task.timeSpent || 0;
      
      // Count by difficulty
      if (task.difficulty === 'Easy') easyCount++;
      else if (task.difficulty === 'Medium') mediumCount++;
      else if (task.difficulty === 'Hard') hardCount++;
    });
  });
  
  this.progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // Update analytics
  this.analytics.totalTasks = totalTasks;
  this.analytics.completedTasks = completedTasks;
  this.analytics.totalTimeSpent = totalTimeSpent;
  this.analytics.averageTaskTime = completedTasks > 0 ? totalTimeSpent / completedTasks : 0;
  this.analytics.completionRate = this.progress;
  
  // Update sheet structure
  this.sheetStructure.totalProblems = totalTasks;
  this.sheetStructure.solvedProblems = completedTasks;
  this.sheetStructure.easyCount = easyCount;
  this.sheetStructure.mediumCount = mediumCount;
  this.sheetStructure.hardCount = hardCount;
  
  return this.progress;
};

// Mark a task as completed
roadmapSchema.methods.completeTask = function(moduleId, taskId) {
  const module = this.modules.find(m => m.id === moduleId);
  if (!module) return false;
  
  const task = module.tasks.find(t => t.id === taskId);
  if (!task) return false;
  
  task.completed = true;
  task.completedAt = new Date();
  
  // Check if all tasks in module are completed
  const allTasksCompleted = module.tasks.every(t => t.completed);
  if (allTasksCompleted && !module.completed) {
    module.completed = true;
    module.completedAt = new Date();
  }
  
  this.calculateProgress();
  return true;
};

// Get roadmap statistics
roadmapSchema.methods.getStats = function() {
  const stats = {
    totalModules: this.modules.length,
    completedModules: this.modules.filter(m => m.completed).length,
    totalTasks: 0,
    completedTasks: 0,
    progress: this.progress,
    estimatedTimeRemaining: 0,
    difficultyDistribution: {
      easy: 0,
      medium: 0,
      hard: 0
    }
  };
  
  this.modules.forEach(module => {
    stats.totalTasks += module.tasks.length;
    stats.completedTasks += module.tasks.filter(t => t.completed).length;
    
    if (!module.completed && module.estimatedTime) {
      const timeMatch = module.estimatedTime.match(/(\d+)/);
      if (timeMatch) {
        stats.estimatedTimeRemaining += parseInt(timeMatch[1]);
      }
    }
    
    // Count difficulty distribution
    module.tasks.forEach(task => {
      if (task.difficulty === 'Easy') stats.difficultyDistribution.easy++;
      else if (task.difficulty === 'Medium') stats.difficultyDistribution.medium++;
      else if (task.difficulty === 'Hard') stats.difficultyDistribution.hard++;
    });
  });
  
  return stats;
};

export default mongoose.model('Roadmap', roadmapSchema);
