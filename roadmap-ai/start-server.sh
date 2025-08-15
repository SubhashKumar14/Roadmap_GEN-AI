#!/bin/bash

echo "🚀 Starting Roadmap AI Backend Server (Real Data Only)"

# Set environment variables
export SUPABASE_URL="https://cnjmsugrswpncagvuxqn.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuam1zdWdyc3dwbmNhZ3Z1eHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDE4NjIsImV4cCI6MjA2OTc3Nzg2Mn0.adaGmRt-kue4BBYQis8n4HAxEFkiFin_7LRRLr4T-Oc"
export JWT_SECRET="your-super-secret-jwt-key-change-in-production"
export CLIENT_URL="http://localhost:3000"
export PORT="5000"
export NODE_ENV="development"

echo "✅ Environment variables set"
echo "📂 Switching to server directory"

cd server

echo "📦 Installing dependencies..."
npm install

echo "🔥 Starting server with real-time features..."
npm run dev
