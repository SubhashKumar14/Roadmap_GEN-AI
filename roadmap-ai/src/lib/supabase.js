import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  })
}

// Create Supabase client with error handling
let supabase
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} catch (error) {
  console.error('Failed to create Supabase client:', error)
  // Create a fallback client to prevent crashes
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null })
    }
  }
}

export { supabase }

// Database helpers
export const db = {
  // Profiles
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // API Keys
  async getApiKeys(userId) {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (error) throw error
    return data || []
  },

  async upsertApiKey(userId, provider, encryptedKey) {
    const { data, error } = await supabase
      .from('api_keys')
      .upsert({
        user_id: userId,
        provider: provider,
        api_key_encrypted: encryptedKey
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Roadmaps
  async createRoadmap(userId, roadmapData) {
    const { data, error } = await supabase
      .from('roadmaps')
      .insert({
        user_id: userId,
        ...roadmapData
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getUserRoadmaps(userId) {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getRoadmap(roadmapId) {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('id', roadmapId)
      .single()
    
    if (error) throw error
    return data
  },

  // Progress
  async getUserProgress(userId, roadmapId = null) {
    let query = supabase
      .from('progress_entries')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
    
    if (roadmapId) {
      query = query.eq('roadmap_id', roadmapId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  // Daily Progress
  async getDailyProgress(userId, year = new Date().getFullYear()) {
    const { data, error } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('user_id', userId)
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
      .order('date', { ascending: true })
    
    if (error) throw error
    return data || []
  }
}
