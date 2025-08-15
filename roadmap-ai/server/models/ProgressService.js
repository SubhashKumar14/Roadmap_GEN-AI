import supabase from '../config/supabase.js';

class ProgressService {
  // Record real task completion with real-time updates
  async recordTaskCompletion(userId, roadmapId, moduleId, taskId, timeSpent = 0) {
    const completedAt = new Date().toISOString();
    
    // Insert or update progress record
    const { data, error } = await supabase
      .from('progress')
      .upsert([
        {
          user_id: userId,
          roadmap_id: roadmapId,
          module_id: moduleId,
          task_id: taskId,
          completed: true,
          time_spent: timeSpent,
          completed_at: completedAt,
          updated_at: completedAt
        }
      ])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
  
  // Get real user progress for a roadmap
  async getUserProgress(userId, roadmapId) {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .eq('roadmap_id', roadmapId);
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data || [];
  }
  
  // Log real user activity (no mock data)
  async logActivity(userId, activityType, activityData = {}) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('activity_log')
      .insert([
        {
          user_id: userId,
          activity_type: activityType,
          activity_data: activityData,
          activity_date: today
        }
      ])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
  
  // Get real user activity data for contribution calendar
  async getUserActivity(userId, year = new Date().getFullYear()) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const { data, error } = await supabase
      .from('activity_log')
      .select('activity_date, activity_type, created_at')
      .eq('user_id', userId)
      .gte('activity_date', startDate)
      .lte('activity_date', endDate)
      .order('activity_date', { ascending: true });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Convert to contribution calendar format (real data only)
    const activityMap = {};
    data.forEach(activity => {
      const date = activity.activity_date;
      if (!activityMap[date]) {
        activityMap[date] = 0;
      }
      activityMap[date]++;
    });
    
    return activityMap;
  }
  
  // Get real user achievements (no mock achievements)
  async getUserAchievements(userId) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements!inner(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data || [];
  }
  
  // Check and award real achievements based on actual progress
  async checkAndAwardAchievements(userId) {
    // Get user's real stats
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stats')
      .eq('id', userId)
      .single();
    
    if (userError) {
      throw new Error(`Database error: ${userError.message}`);
    }
    
    const stats = user.stats || {};
    
    // Get all available achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*');
    
    if (achievementsError) {
      throw new Error(`Database error: ${achievementsError.message}`);
    }
    
    // Get user's current achievements
    const userAchievements = await this.getUserAchievements(userId);
    const earnedAchievementIds = userAchievements.map(ua => ua.achievements.achievement_id);
    
    const newAchievements = [];
    
    // Check each achievement against real user stats
    for (const achievement of achievements) {
      if (earnedAchievementIds.includes(achievement.achievement_id)) {
        continue; // Already earned
      }
      
      const criteria = achievement.criteria;
      let earned = false;
      
      switch (criteria.type) {
        case 'tasks_completed':
          earned = (stats.totalCompleted || 0) >= criteria.value;
          break;
        case 'streak_days':
          earned = (stats.streak || 0) >= criteria.value;
          break;
        case 'roadmaps_completed':
          earned = (stats.roadmapsCompleted || 0) >= criteria.value;
          break;
      }
      
      if (earned) {
        // Award the achievement
        const { data, error } = await supabase
          .from('user_achievements')
          .insert([
            {
              user_id: userId,
              achievement_id: achievement.id
            }
          ])
          .select()
          .single();
        
        if (!error) {
          newAchievements.push({
            ...data,
            achievements: achievement
          });
        }
      }
    }
    
    return newAchievements;
  }
  
  // Get real user stats summary (no mock data)
  async getUserStatsSummary(userId) {
    // Get user stats
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stats, active_learning_days, last_active_date, streak_start_date')
      .eq('id', userId)
      .single();
    
    if (userError) {
      throw new Error(`Database error: ${userError.message}`);
    }
    
    // Get real roadmap count
    const { count: roadmapCount, error: roadmapError } = await supabase
      .from('roadmaps')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (roadmapError) {
      throw new Error(`Database error: ${roadmapError.message}`);
    }
    
    // Get real completed roadmaps count
    const { count: completedRoadmapsCount, error: completedError } = await supabase
      .from('roadmaps')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('progress', 100);
    
    if (completedError) {
      throw new Error(`Database error: ${completedError.message}`);
    }
    
    return {
      ...user.stats,
      totalRoadmaps: roadmapCount || 0,
      roadmapsCompleted: completedRoadmapsCount || 0,
      activeLearningDays: user.active_learning_days?.length || 0,
      lastActiveDate: user.last_active_date,
      streakStartDate: user.streak_start_date
    };
  }
}

export default new ProgressService();
