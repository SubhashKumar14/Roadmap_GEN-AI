-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  profile_image TEXT,
  bio TEXT,
  location VARCHAR(255),
  github_username VARCHAR(255),
  twitter_username VARCHAR(255),
  learning_goals TEXT[],
  
  -- API Keys (encrypted)
  api_keys JSONB DEFAULT '{}',
  
  -- User Stats
  stats JSONB DEFAULT '{
    "streak": 0,
    "totalCompleted": 0,
    "level": 1,
    "experiencePoints": 0,
    "weeklyGoal": 10,
    "weeklyProgress": 0,
    "roadmapsCompleted": 0,
    "totalStudyTime": 0,
    "globalRanking": 999999,
    "attendedContests": 0,
    "problemsSolved": {
      "easy": 0,
      "medium": 0,
      "hard": 0,
      "total": 0
    }
  }',
  
  -- Activity tracking
  active_learning_days TEXT[],
  last_active_date TIMESTAMP,
  streak_start_date TIMESTAMP,
  
  -- Preferences
  preferences JSONB DEFAULT '{
    "emailNotifications": true,
    "weeklyDigest": true,
    "achievementAlerts": true,
    "theme": "light"
  }',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Roadmaps table
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(50),
  estimated_duration VARCHAR(100),
  category VARCHAR(100),
  ai_provider VARCHAR(50),
  modules JSONB NOT NULL DEFAULT '[]',
  progress FLOAT DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Progress tracking table
CREATE TABLE IF NOT EXISTS progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  module_id VARCHAR(255) NOT NULL,
  task_id VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT false,
  time_spent INTEGER DEFAULT 0, -- in minutes
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(roadmap_id, module_id, task_id)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  achievement_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  category VARCHAR(100),
  difficulty VARCHAR(50),
  criteria JSONB NOT NULL,
  rewards JSONB NOT NULL,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User achievements table (earned achievements)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  activity_data JSONB DEFAULT '{}',
  activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Roadmap likes table
CREATE TABLE IF NOT EXISTS roadmap_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, roadmap_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_public ON roadmaps(is_public);
CREATE INDEX IF NOT EXISTS idx_progress_user_roadmap ON progress(user_id, roadmap_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON activity_log(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (basic examples)
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view own roadmaps" ON roadmaps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view public roadmaps" ON roadmaps FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own progress" ON progress FOR ALL USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO achievements (achievement_id, title, description, icon, category, difficulty, criteria, rewards, order_index) VALUES
('first-steps', 'First Steps', 'Complete your first task', 'Star', 'completion', 'bronze', '{"type": "tasks_completed", "value": 1, "timeframe": "all_time"}', '{"experiencePoints": 50, "badge": "first-steps"}', 1),
('week-warrior', 'Week Warrior', 'Maintain a 7-day learning streak', 'Flame', 'streak', 'silver', '{"type": "streak_days", "value": 7, "timeframe": "all_time"}', '{"experiencePoints": 100, "badge": "week-warrior"}', 2),
('module-master', 'Module Master', 'Complete 5 learning modules', 'Target', 'completion', 'silver', '{"type": "tasks_completed", "value": 5, "timeframe": "all_time"}', '{"experiencePoints": 75, "badge": "module-master"}', 3),
('road-runner', 'Road Runner', 'Complete your first roadmap', 'Trophy', 'special', 'gold', '{"type": "roadmaps_completed", "value": 1, "timeframe": "all_time"}', '{"experiencePoints": 200, "badge": "road-runner"}', 4)
ON CONFLICT (achievement_id) DO NOTHING;
