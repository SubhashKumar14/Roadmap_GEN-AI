import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import roadmapRoutes from './routes/roadmap.js';
import progressRoutes from './routes/progress.js';
import userRoutes from './routes/user.js';

// Import Supabase
import supabase from './config/supabase.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:8080",
      "http://localhost:5173"
    ],
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:5173"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supabase connection test and initialization
let supabaseConnected = false;

const initializeSupabase = async () => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error) {
      console.error('Supabase connection error:', error.message);
      console.log('Please check your Supabase environment variables');
      supabaseConnected = false;
    } else {
      console.log('✅ Supabase connected successfully');
      supabaseConnected = true;
    }
  } catch (error) {
    console.error('Supabase initialization error:', error.message);
    console.log('Server will continue without Supabase - some features may be limited');
    supabaseConnected = false;
  }
};

// Initialize Supabase connection
initializeSupabase();

// Middleware to check Supabase connection
app.use((req, res, next) => {
  req.supabaseConnected = supabaseConnected;
  next();
});

// Socket.IO real-time connection handling (NO MOCK DATA)
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Join user to their personal room for real-time updates
  socket.on('join-room', (userId) => {
    socket.join(userId);
    socket.userId = userId;
    console.log(`👤 User ${userId} joined real-time room`);

    // Emit real-time connection status
    socket.emit('real-time-connected', {
      message: 'Real-time updates enabled',
      userId,
      timestamp: new Date().toISOString()
    });
  });

  // Real-time progress updates (actual user data only)
  socket.on('progress-update', (data) => {
    console.log(`📊 Real-time progress update from user ${socket.userId}:`, data);

    // Broadcast real progress to user's devices
    socket.to(socket.userId).emit('progress-updated', {
      ...data,
      timestamp: new Date().toISOString(),
      source: 'real-time'
    });
  });

  // Real-time roadmap sharing (actual roadmaps only)
  socket.on('roadmap-shared', (data) => {
    console.log(`🗺️  Real roadmap shared by user ${socket.userId}:`, data.title);

    // Broadcast real roadmap to all connected users
    io.emit('new-roadmap-shared', {
      ...data,
      sharedBy: socket.userId,
      timestamp: new Date().toISOString(),
      type: 'real-roadmap'
    });
  });

  // Real-time achievement notifications (actual achievements only)
  socket.on('achievement-earned', (achievement) => {
    console.log(`🏆 Real achievement earned by user ${socket.userId}:`, achievement.title);

    // Broadcast to user's devices
    socket.to(socket.userId).emit('achievement-notification', {
      ...achievement,
      timestamp: new Date().toISOString(),
      type: 'real-achievement'
    });
  });

  // Real-time streak updates (actual streak data only)
  socket.on('streak-updated', (streakData) => {
    console.log(`🔥 Real streak update for user ${socket.userId}:`, streakData.streak);

    // Broadcast to user's devices
    socket.to(socket.userId).emit('streak-notification', {
      ...streakData,
      timestamp: new Date().toISOString(),
      type: 'real-streak'
    });
  });

  // Real-time AI roadmap generation status
  socket.on('roadmap-generation-started', (data) => {
    console.log(`🤖 Real AI roadmap generation started for user ${socket.userId}:`, data.topic);

    socket.emit('generation-status', {
      status: 'generating',
      message: 'AI is generating your real roadmap...',
      topic: data.topic,
      provider: data.aiProvider,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('roadmap-generation-completed', (roadmap) => {
    console.log(`✅ Real AI roadmap completed for user ${socket.userId}:`, roadmap.title);

    socket.emit('generation-status', {
      status: 'completed',
      message: 'Real roadmap generated successfully!',
      roadmap,
      timestamp: new Date().toISOString()
    });
  });

  // Real-time learning session tracking
  socket.on('learning-session-start', (data) => {
    console.log(`📚 Real learning session started by user ${socket.userId}:`, data.roadmapId);

    socket.emit('session-started', {
      ...data,
      timestamp: new Date().toISOString(),
      sessionId: Math.random().toString(36).substr(2, 9)
    });
  });

  socket.on('learning-session-end', (data) => {
    console.log(`📚 Real learning session ended by user ${socket.userId}:`, data.duration, 'minutes');

    socket.emit('session-ended', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id, socket.userId || 'Unknown');
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, io };
