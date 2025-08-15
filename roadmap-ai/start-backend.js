import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set environment variables
process.env.SUPABASE_URL = 'https://cnjmsugrswpncagvuxqn.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuam1zdWdyc3dwbmNhZ3Z1eHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDE4NjIsImV4cCI6MjA2OTc3Nzg2Mn0.adaGmRt-kue4BBYQis8n4HAxEFkiFin_7LRRLr4T-Oc';
process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.PORT = '5000';
process.env.NODE_ENV = 'development';

console.log('🚀 Starting backend server with environment variables...');

// Start the server
const serverPath = join(__dirname, 'server', 'server.js');
const serverProcess = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

serverProcess.on('error', (err) => {
  console.error('Failed to start backend server:', err);
});

serverProcess.on('close', (code) => {
  console.log(`Backend server exited with code ${code}`);
});
