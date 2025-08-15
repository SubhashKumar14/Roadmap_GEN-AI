import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthProvider.jsx';
import Header from '../components/Header.jsx';
import Dashboard from '../components/Dashboard.jsx';
import RoadmapGenerator from '../components/RoadmapGenerator.jsx';
import RoadmapView from '../components/RoadmapView.jsx';
import Achievements from '../components/Achievements.jsx';
import Profile from '../components/Profile.jsx';
import LandingPage from '../components/LandingPage.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Plus, BookOpen } from 'lucide-react';
import { roadmapService, userService, progressService } from '../services/api.js';
import socketService from '../services/socketService.js';
import { toast } from '../hooks/use-toast.js';
import { calculateProgress } from '../lib/utils.js';

const Index = () => {
  const { user, loading } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // User data state - only real progress, no demo data
  const [userStats, setUserStats] = useState({
    streak: 0,
    totalCompleted: 0,
    level: 1,
    experiencePoints: 0,
    activeLearningDays: 0,
    weeklyGoal: 10,
    weeklyProgress: 0,
    roadmapsCompleted: 0,
    totalStudyTime: 0,
    problemsSolved: {
      easy: 0,
      medium: 0,
      hard: 0,
      total: 0
    },
    globalRanking: 999999,
    attendedContests: 0
  });

  const [achievements, setAchievements] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);

  // Initialize user data when authenticated
  useEffect(() => {
    if (!loading && user) {
      console.log('User authenticated:', user._id, user.email);
      initializeUserData();
      connectSocket();
    } else if (!loading && !user) {
      setIsLoading(false);
    }
  }, [loading, user]);

  const initializeUserData = async () => {
    try {
      console.log('🚀 Initializing user data for:', user._id);

      // Load user data with individual error handling
      const [statsData, roadmapsData, achievementsData] = await Promise.allSettled([
        userService.getStats(),
        roadmapService.getUserRoadmaps(),
        progressService.getAchievements()
      ]);

      // Handle stats
      if (statsData.status === 'fulfilled') {
        setUserStats(statsData.value);
        console.log('User stats loaded:', statsData.value);
      } else {
        console.error('❌ Error loading stats:', statsData.reason);
        // Keep default empty stats
      }

      // Handle roadmaps
      if (roadmapsData.status === 'fulfilled') {
        const safeRoadmapsData = Array.isArray(roadmapsData.value) ? roadmapsData.value : [];
        setRoadmaps(safeRoadmapsData);
        console.log('User roadmaps loaded:', safeRoadmapsData.length);
      } else {
        console.error('❌ Error loading roadmaps:', roadmapsData.reason);
        setRoadmaps([]);
      }

      // Handle achievements
      if (achievementsData.status === 'fulfilled') {
        const safeAchievementsData = Array.isArray(achievementsData.value) ? achievementsData.value : [];
        setAchievements(safeAchievementsData);
        console.log('User achievements loaded:', safeAchievementsData.length);
      } else {
        console.error('❌ Error loading achievements:', achievementsData.reason);
        setAchievements([]);
      }

      toast({
        title: "Welcome back! 👋",
        description: "Your learning journey continues with real progress tracking.",
      });

    } catch (error) {
      console.error('❌ Error initializing user data:', error);

      // Set zero defaults if everything fails
      setUserStats({
        streak: 0,
        totalCompleted: 0,
        level: 1,
        experiencePoints: 0,
        activeLearningDays: 0,
        weeklyGoal: 10,
        weeklyProgress: 0,
        roadmapsCompleted: 0,
        totalStudyTime: 0,
        problemsSolved: { easy: 0, medium: 0, hard: 0, total: 0 },
        globalRanking: 999999,
        attendedContests: 0
      });

      setRoadmaps([]);
      setAchievements([]);

      toast({
        title: "Welcome! 🌐",
        description: "Ready to start your real learning journey. No demo data - only your actual progress.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connectSocket = () => {
    if (user?._id) {
      socketService.connect(user._id);
      
      // Listen for real-time updates
      socketService.onProgressUpdate((data) => {
        toast({
          title: "Progress Synced! 📱",
          description: "Your progress has been updated across all devices.",
        });
      });

      socketService.onAchievementEarned((achievement) => {
        toast({
          title: "Achievement Unlocked! 🏆",
          description: `You earned "${achievement.title}"!`,
        });
      });
    }
  };

  const handleRoadmapGenerated = (newRoadmap) => {
    setRoadmaps(prev => [newRoadmap, ...prev]);
    setShowGenerator(false);
    setActiveTab("roadmaps");
    toast({
      title: "Roadmap Generated! 🎉",
      description: `Your "${newRoadmap.title}" roadmap is ready to start.`,
    });

    // Emit socket event
    socketService.emitRoadmapShared(newRoadmap);
  };

  const handleTaskComplete = async (roadmapId, moduleId, taskId) => {
    try {
      // Find current task state
      const currentRoadmap = roadmaps.find(r => r._id === roadmapId);
      const currentModule = currentRoadmap?.modules.find(m => m.id === moduleId);
      const currentTask = currentModule?.tasks.find(t => t.id === taskId);
      const wasCompleted = currentTask?.completed || false;
      const newCompletedState = !wasCompleted;

      console.log('📝 User action - task completion:', {
        roadmapId,
        moduleId,
        taskId,
        wasCompleted,
        newState: newCompletedState,
        isRealCompletion: newCompletedState && !wasCompleted
      });

      // Update backend
      await roadmapService.updateProgress(roadmapId, moduleId, taskId, newCompletedState);

      // Update activity if new completion
      if (newCompletedState && !wasCompleted) {
        await progressService.addActivity('task_completed');
        await progressService.checkAchievements();
      }

      // Update local state
      setRoadmaps(prev => prev.map(roadmap => {
        if (roadmap._id === roadmapId) {
          const updatedModules = roadmap.modules.map(module => {
            if (module.id === moduleId) {
              const updatedTasks = module.tasks.map(task =>
                task.id === taskId ? {
                  ...task,
                  completed: newCompletedState,
                  completedAt: newCompletedState ? new Date().toISOString() : undefined
                } : task
              );
              return { ...module, tasks: updatedTasks };
            }
            return module;
          });

          const progress = calculateProgress(updatedModules);
          return { ...roadmap, modules: updatedModules, progress };
        }
        return roadmap;
      }));

      // Update user stats for actual new completions
      if (newCompletedState && !wasCompleted) {
        setUserStats(prev => {
          const newStats = {
            ...prev,
            totalCompleted: prev.totalCompleted + 1,
            weeklyProgress: prev.weeklyProgress + 1,
            experiencePoints: prev.experiencePoints + 10,
            level: Math.floor((prev.experiencePoints + 10) / 300) + 1
          };

          // Update problem counts based on difficulty
          if (currentTask?.difficulty) {
            const difficulty = currentTask.difficulty.toLowerCase();
            if (newStats.problemsSolved[difficulty] !== undefined) {
              newStats.problemsSolved[difficulty] += 1;
              newStats.problemsSolved.total += 1;
            }
          }

          return newStats;
        });

        console.log('📊 Real task completion recorded - stats updated');
      } else if (!newCompletedState && wasCompleted) {
        // Subtract stats when unchecking
        setUserStats(prev => {
          const newStats = {
            ...prev,
            totalCompleted: Math.max(0, prev.totalCompleted - 1),
            weeklyProgress: Math.max(0, prev.weeklyProgress - 1),
            experiencePoints: Math.max(0, prev.experiencePoints - 10),
            level: Math.floor(Math.max(0, prev.experiencePoints - 10) / 300) + 1
          };

          if (currentTask?.difficulty) {
            const difficulty = currentTask.difficulty.toLowerCase();
            if (newStats.problemsSolved[difficulty] !== undefined) {
              newStats.problemsSolved[difficulty] = Math.max(0, newStats.problemsSolved[difficulty] - 1);
              newStats.problemsSolved.total = Math.max(0, newStats.problemsSolved.total - 1);
            }
          }

          return newStats;
        });
      }

      toast({
        title: newCompletedState ? "Task Completed! ✅" : "Task Unchecked! ⬜",
        description: newCompletedState && !wasCompleted ?
          "Great progress! Real completion recorded." :
          newCompletedState ? "Task was already completed." :
          "Task marked as incomplete.",
      });

      // Emit progress update
      socketService.emitProgressUpdate({
        roadmapId,
        moduleId,
        taskId,
        completed: newCompletedState,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error updating task:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    if (selectedRoadmap) {
      const roadmap = roadmaps.find(r => r._id === selectedRoadmap);
      if (!roadmap) return null;
      
      return (
        <RoadmapView
          roadmap={roadmap}
          onTaskComplete={(moduleId, taskId) => handleTaskComplete(selectedRoadmap, moduleId, taskId)}
          onBack={() => setSelectedRoadmap(null)}
        />
      );
    }

    if (showGenerator) {
      return (
        <RoadmapGenerator
          onRoadmapGenerated={handleRoadmapGenerated}
          onBack={() => setShowGenerator(false)}
        />
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            userStats={userStats}
            roadmaps={roadmaps}
            onCreateRoadmap={() => setShowGenerator(true)}
            onViewRoadmap={(roadmapId) => setSelectedRoadmap(roadmapId)}
          />
        );
      
      case "roadmaps":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">My Roadmaps</h2>
                <p className="text-muted-foreground">Manage your learning paths</p>
              </div>
              <Button onClick={() => setShowGenerator(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Roadmap
              </Button>
            </div>

            {roadmaps.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No roadmaps yet</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Generate your first AI-powered learning roadmap to get started
                  </p>
                  <Button onClick={() => setShowGenerator(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Roadmap
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {roadmaps.map((roadmap) => (
                  <Card key={roadmap._id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedRoadmap(roadmap._id)}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-2">{roadmap.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{roadmap.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{Math.round(roadmap.progress || 0)}%</span>
                          <span>{roadmap.modules?.length || 0} modules</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full progress-fill" 
                            style={{ width: `${roadmap.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <span className="text-xs text-muted-foreground">{roadmap.estimatedDuration}</span>
                        <div className="flex gap-2">
                          <span className="text-xs px-2 py-1 bg-secondary rounded">
                            {roadmap.difficulty}
                          </span>
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                            {roadmap.aiProvider}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      
      case "achievements":
        return <Achievements userStats={userStats} achievements={achievements} />;
      
      case "profile":
        return <Profile user={user} userStats={userStats} />;
      
      default:
        return (
          <Dashboard
            userStats={userStats}
            roadmaps={roadmaps}
            onCreateRoadmap={() => setShowGenerator(true)}
            onViewRoadmap={(roadmapId) => setSelectedRoadmap(roadmapId)}
          />
        );
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-8 h-8"></div>
        <p className="ml-4">Loading your learning journey...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!user ? (
        <LandingPage />
      ) : (
        <>
          <Header
            activeTab={activeTab}
            onTabChange={setActiveTab}
            userStats={userStats}
          />
          <main className="container mx-auto px-4 py-8">
            {renderContent()}
          </main>
        </>
      )}
    </div>
  );
};

export default Index;
