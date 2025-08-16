import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function encryptApiKey(key) {
  // Simple base64 encoding (use proper encryption in production)
  return btoa(key)
}

export function decryptApiKey(encryptedKey) {
  try {
    return atob(encryptedKey)
  } catch {
    return encryptedKey
  }
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function calculateProgress(completedTasks, totalTasks) {
  if (totalTasks === 0) return 0
  return Math.round((completedTasks / totalTasks) * 100)
}

export function getDifficultyColor(difficulty) {
  const colors = {
    beginner: 'text-green-600 bg-green-100',
    intermediate: 'text-yellow-600 bg-yellow-100',
    advanced: 'text-red-600 bg-red-100',
    easy: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    hard: 'text-red-600 bg-red-100'
  }
  return colors[difficulty?.toLowerCase()] || colors.medium
}

export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
