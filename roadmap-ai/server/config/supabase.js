import { createClient } from '@supabase/supabase-js';

// Use hardcoded values for testing (in production, use environment variables)
const supabaseUrl = process.env.SUPABASE_URL || 'https://cnjmsugrswpncagvuxqn.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuam1zdWdyc3dwbmNhZ3Z1eHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDE4NjIsImV4cCI6MjA2OTc3Nzg2Mn0.adaGmRt-kue4BBYQis8n4HAxEFkiFin_7LRRLr4T-Oc';

console.log('🔍 Supabase Configuration:');
console.log('URL:', supabaseUrl);
console.log('Key configured:', supabaseServiceRoleKey ? 'Yes' : 'No');

// Create client for backend operations (using anon key temporarily for testing)
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'roadmap-ai-backend'
    }
  }
});

export default supabase;
