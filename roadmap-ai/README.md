# Roadmap AI - AI-Powered Learning Platform

A comprehensive learning platform that generates personalized roadmaps using multiple AI providers (OpenAI, Gemini, Perplexity) with real-time progress tracking and A2Z Striver-style DSA sheet format.

## Features

### 🤖 AI-Powered Roadmap Generation
- **Multi-AI Support**: Choose from OpenAI GPT-4, Google Gemini, or Perplexity AI
- **Smart Provider Selection**: Automatic AI provider recommendation based on topic classification
- **Custom API Keys**: Use your own API keys when rate limits are reached
- **A2Z Striver Format**: Structured learning paths with modules, tasks, and difficulty levels

### 📊 Real-Time Progress Tracking
- **GitHub-Style Calendar**: Visual contribution tracking with activity heatmap
- **Streak Management**: Daily learning streak tracking and maintenance
- **XP & Levels**: Gamified learning experience with experience points and levels
- **Problem Statistics**: LeetCode-style difficulty distribution (Easy/Medium/Hard)

### 🏆 Achievement System
- **Comprehensive Badges**: Earn achievements for various milestones
- **Progress Tracking**: Real-time achievement progress monitoring
- **Reward System**: Experience points and special titles for accomplishments
- **Categories**: Achievements across completion, streaks, milestones, and time spent

### 📱 Modern User Experience
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile
- **Real-Time Updates**: WebSocket integration for live progress synchronization
- **Dark/Light Mode**: Customizable theme preferences
- **Profile Management**: Comprehensive user profiles with social links

### 🔐 Authentication & Security
- **JWT Authentication**: Secure token-based authentication system
- **Encrypted API Keys**: Secure storage of user's personal AI API keys
- **Input Validation**: Comprehensive validation for all user inputs
- **Rate Limiting**: Protection against abuse and spam

## Technology Stack

### Frontend
- **React 18** with modern hooks and context
- **Vite** for fast development and building
- **TailwindCSS** for responsive styling
- **Radix UI** for accessible component primitives
- **Socket.IO Client** for real-time features
- **Axios** for API communication
- **React Router** for navigation

### Backend
- **Node.js & Express** for server framework
- **MongoDB** with Mongoose ODM
- **Socket.IO** for WebSocket communication
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Helmet** for security headers
- **Express Rate Limit** for API protection

### AI Integrations
- **OpenAI GPT-4** - Best for technical/programming topics
- **Google Gemini** - Excellent for creative/design topics  
- **Perplexity AI** - Perfect for current trends/research
- **YouTube Data API** - For educational video recommendations

## Installation & Setup

### Prerequisites
- Node.js 16+ 
- MongoDB Atlas account or local MongoDB
- API keys for AI providers (optional, fallback keys included)

### 1. Clone Repository
