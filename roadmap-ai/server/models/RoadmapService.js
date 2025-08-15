import supabase from '../config/supabase.js';

class RoadmapService {
  // Create new roadmap
  async createRoadmap(userId, roadmapData) {
    const { data, error } = await supabase
      .from('roadmaps')
      .insert([
        {
          user_id: userId,
          title: roadmapData.title,
          description: roadmapData.description,
          difficulty: roadmapData.difficulty,
          estimated_duration: roadmapData.estimatedDuration,
          category: roadmapData.category,
          ai_provider: roadmapData.aiProvider,
          modules: roadmapData.modules || [],
          progress: roadmapData.progress || 0,
          is_public: roadmapData.isPublic || false
        }
      ])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
  
  // Get user's roadmaps
  async getUserRoadmaps(userId) {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data || [];
  }
  
  // Get roadmap by ID
  async getRoadmapById(roadmapId) {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('id', roadmapId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
  
  // Update roadmap progress
  async updateProgress(roadmapId, progress) {
    const { data, error } = await supabase
      .from('roadmaps')
      .update({
        progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', roadmapId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
  
  // Update roadmap modules
  async updateModules(roadmapId, modules) {
    const { data, error } = await supabase
      .from('roadmaps')
      .update({
        modules,
        updated_at: new Date().toISOString()
      })
      .eq('id', roadmapId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
  
  // Get public roadmaps
  async getPublicRoadmaps(limit = 20, offset = 0, category = null) {
    let query = supabase
      .from('roadmaps')
      .select(`
        *,
        users!inner(name, profile_image)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data || [];
  }
  
  // Toggle roadmap visibility
  async toggleVisibility(roadmapId, userId, isPublic) {
    const { data, error } = await supabase
      .from('roadmaps')
      .update({
        is_public: isPublic,
        updated_at: new Date().toISOString()
      })
      .eq('id', roadmapId)
      .eq('user_id', userId) // Ensure user owns the roadmap
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
  
  // Like/unlike roadmap
  async toggleLike(roadmapId, userId) {
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('roadmap_likes')
      .select('id')
      .eq('roadmap_id', roadmapId)
      .eq('user_id', userId)
      .single();
    
    if (existingLike) {
      // Unlike
      await supabase
        .from('roadmap_likes')
        .delete()
        .eq('roadmap_id', roadmapId)
        .eq('user_id', userId);
      
      // Decrement likes count
      await supabase.rpc('decrement_likes', { roadmap_id: roadmapId });
      
      return { liked: false };
    } else {
      // Like
      await supabase
        .from('roadmap_likes')
        .insert([
          {
            roadmap_id: roadmapId,
            user_id: userId
          }
        ]);
      
      // Increment likes count
      await supabase.rpc('increment_likes', { roadmap_id: roadmapId });
      
      return { liked: true };
    }
  }
  
  // Fork roadmap
  async forkRoadmap(roadmapId, userId) {
    // Get original roadmap
    const originalRoadmap = await this.getRoadmapById(roadmapId);
    if (!originalRoadmap) {
      throw new Error('Roadmap not found');
    }
    
    // Create forked roadmap
    const forkedData = {
      title: `${originalRoadmap.title} (Fork)`,
      description: originalRoadmap.description,
      difficulty: originalRoadmap.difficulty,
      estimatedDuration: originalRoadmap.estimated_duration,
      category: originalRoadmap.category,
      aiProvider: originalRoadmap.ai_provider,
      modules: originalRoadmap.modules,
      progress: 0,
      isPublic: false
    };
    
    const { data, error } = await supabase
      .from('roadmaps')
      .insert([
        {
          user_id: userId,
          ...forkedData
        }
      ])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Increment fork count on original
    await supabase.rpc('increment_forks', { roadmap_id: roadmapId });
    
    return data;
  }
  
  // Delete roadmap
  async deleteRoadmap(roadmapId, userId) {
    const { data, error } = await supabase
      .from('roadmaps')
      .delete()
      .eq('id', roadmapId)
      .eq('user_id', userId) // Ensure user owns the roadmap
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
}

export default new RoadmapService();
