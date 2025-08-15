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

// MongoDB connection
let mongoConnected = false;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(async () => {
  console.log('MongoDB connected');
  mongoConnected = true;
  
  // Initialize default achievements
  try {
    const achievementCount = await Achievement.countDocuments();
    
    if (achievementCount === 0) {
      console.log('Seeding initial achievements...');
      const achievements = [
        {
          id: 'first-steps',
          title: 'First Steps',
          description: 'Complete your first task',
          icon: 'Star',
          category: 'completion',
          difficulty: 'bronze',
          criteria: { type: 'tasks_completed', value: 1, timeframe: 'all_time' },
          rewards: { experiencePoints: 50, badge: 'first-steps' },
          order: 1
        },
        {
          id: 'week-warrior',
          title: 'Week Warrior',
          description: 'Maintain a 7-day learning streak',
          icon: 'Flame',
          category: 'streak',
          difficulty: 'silver',
          criteria: { type: 'streak_days', value: 7, timeframe: 'all_time' },
          rewards: { experiencePoints: 100, badge: 'week-warrior' },
          order: 2
        },
        {
          id: 'module-master',
          title: 'Module Master',
          description: 'Complete 5 learning modules',
          icon: 'Target',
          category: 'completion',
          difficulty: 'silver',
          criteria: { type: 'tasks_completed', value: 5, timeframe: 'all_time' },
          rewards: { experiencePoints: 75, badge: 'module-master' },
          order: 3
        },
        {
          id: 'road-runner',
          title: 'Road Runner',
          description: 'Complete your first roadmap',
          icon: 'Trophy',
          category: 'special',
          difficulty: 'gold',
          criteria: { type: 'roadmaps_completed', value: 1, timeframe: 'all_time' },
          rewards: { experiencePoints: 200, badge: 'road-runner' },
          order: 4
        }
      ];
      
      await Achievement.insertMany(achievements);
      console.log('Initial achievements seeded');
    }
  } catch (error) {
    console.error('Error during initialization:', error);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  console.log('Server will continue without MongoDB - some features may be limited');
  mongoConnected = false;
});

// Middleware to check MongoDB connection
app.use((req, res, next) => {
  req.mongoConnected = mongoConnected;
  next();
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('progress-update', (data) => {
    // Broadcast progress update to all users in the room
    socket.to(data.userId).emit('progress-updated', data);
  });

  socket.on('roadmap-shared', (data) => {
    // Broadcast roadmap sharing
    io.emit('new-roadmap-shared', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
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
