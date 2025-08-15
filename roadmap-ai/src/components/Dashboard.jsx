import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card.jsx';
import { Progress } from './ui/Progress.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { CalendarDays, Target, Trophy, TrendingUp, Flame, Star, BookOpen, CheckCircle, Plus } from 'lucide-react';

const Dashboard = ({ userStats, roadmaps, onCreateRoadmap, onViewRoadmap }) => {
  const safeRoadmaps = Array.isArray(roadmaps) ? roadmaps : [];
  const activeRoadmaps = safeRoadmaps.filter(r => r.progress < 100);
  const completedRoadmaps = safeRoadmaps.filter(r => r.progress === 100);

  const achievements = [
    { id: 1, title: "First Steps", description: "Complete your first task", icon: Star, earned: userStats.totalCompleted >= 1 },
    { id: 2, title: "Week Warrior", description: "7-day learning streak", icon: Flame, earned: userStats.streak >= 7 },
    { id: 3, title: "Module Master", description: "Complete 5 modules", icon: Target, earned: userStats.totalCompleted >= 5 },
    { id: 4, title: "Road Runner", description: "Complete a full roadmap", icon: Trophy, earned: completedRoadmaps.length > 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold mb-2">Welcome to Your Learning Journey</h1>
        <p className="text-muted-foreground text-lg">Track your progress, complete roadmaps, and achieve your goals</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.streak}</div>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalCompleted}</div>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.level}</div>
            <p className="text-xs text-muted-foreground">{userStats.experiencePoints} XP</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roadmaps</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRoadmaps.length}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Goal</CardTitle>
          <CardDescription>Complete {userStats.weeklyGoal} tasks this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={(userStats.weeklyProgress / userStats.weeklyGoal) * 100} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{userStats.weeklyProgress} / {userStats.weeklyGoal} tasks</span>
              <span>{Math.round((userStats.weeklyProgress / userStats.weeklyGoal) * 100)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Problem Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Problem Solving Stats</CardTitle>
          <CardDescription>Your coding journey progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userStats.problemsSolved?.easy || 0}</div>
              <div className="text-sm text-muted-foreground">Easy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{userStats.problemsSolved?.medium || 0}</div>
              <div className="text-sm text-muted-foreground">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{userStats.problemsSolved?.hard || 0}</div>
              <div className="text-sm text-muted-foreground">Hard</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{userStats.problemsSolved?.total || 0}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
          <CardDescription>Your learning milestones and badges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div 
                  key={achievement.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border ${
                    achievement.earned ? 'achievement-earned' : 'opacity-50'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <div className="flex-1">
                    <p className="font-medium">{achievement.title}</p>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                  {achievement.earned && (
                    <Badge variant="secondary">Earned</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Roadmaps */}
      {activeRoadmaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {activeRoadmaps.slice(0, 3).map((roadmap) => (
                <div 
                  key={roadmap._id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => onViewRoadmap(roadmap._id)}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{roadmap.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Progress value={roadmap.progress || 0} className="flex-1" />
                      <span className="text-sm text-muted-foreground">
                        {Math.round(roadmap.progress || 0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex justify-center">
        <Button onClick={onCreateRoadmap} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Create New Roadmap
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
