import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function calculateProgress(modules) {
  if (!modules || modules.length === 0) return 0;
  
  const totalTasks = modules.reduce((sum, module) => 
    sum + (module.tasks ? module.tasks.length : 0), 0
  );
  
  const completedTasks = modules.reduce((sum, module) => 
    sum + (module.tasks ? module.tasks.filter(task => task.completed).length : 0), 0
  );
  
  return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function getDifficultyColor(difficulty) {
  const colors = {
    Easy: 'text-green-600 bg-green-100',
    Medium: 'text-yellow-600 bg-yellow-100', 
    Hard: 'text-red-600 bg-red-100',
    beginner: 'text-green-600 bg-green-100',
    intermediate: 'text-yellow-600 bg-yellow-100',
    advanced: 'text-red-600 bg-red-100'
  };
  return colors[difficulty] || colors.Medium;
}

export function getAIProviderInfo(provider) {
  const providers = {
    openai: { 
      name: 'OpenAI', 
      color: 'bg-green-100 text-green-800',
      icon: '🧠'
    },
    gemini: { 
      name: 'Gemini', 
      color: 'bg-blue-100 text-blue-800',
      icon: '✨'
    },
    perplexity: { 
      name: 'Perplexity', 
      color: 'bg-purple-100 text-purple-800',
      icon: '🔍'
    }
  };
  return providers[provider] || providers.openai;
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}
