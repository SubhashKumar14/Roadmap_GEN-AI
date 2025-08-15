import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Progress } from './ui/Progress.jsx';
import { Trophy, Star, Target, Flame, BookOpen, Code, Palette, Globe, Calendar, Clock, CheckCircle, Award } from 'lucide-react';

const Achievements = ({ userStats, achievements }) => {
  const allAchievements = [
    {
      id: 1,
      title: "First Steps",
      description: "Complete your first learning task",
      icon: Star,
      category: "Getting Started",
      requirement: 1,
      current: Math.min(userStats.totalCompleted, 1),
      type: "tasks",
      difficulty: "easy",
      points: 10,
      earned: userStats.totalCompleted >= 1
    },
    {
      id: 2,
      title: "Task Master",
      description: "Complete 10 learning tasks",
      icon: CheckCircle,
      category: "Progress",
      requirement: 10,
      current: Math.min(userStats.totalCompleted, 10),
      type: "tasks",
      difficulty: "medium",
      points: 50,
      earned: userStats.totalCompleted >= 10
    },
    {
      id: 3,
      title: "Century Club",
      description: "Complete 100 learning tasks",
      icon: Target,
      category: "Progress", 
      requirement: 100,
      current: Math.min(userStats.totalCompleted, 100),
      type: "tasks",
      difficulty: "hard",
      points: 500,
      earned: userStats.totalCompleted >= 100
    },
    {
      id: 4,
      title: "Week Warrior",
      description: "Maintain a 7-day learning streak",
      icon: Flame,
      category: "Consistency",
      requirement: 7,
      current: Math.min(userStats.streak, 7),
      type: "streak",
      difficulty: "medium",
      points: 75,
      earned: userStats.streak >= 7
    },
    {
      id: 5,
      title: "Monthly Master",
      description: "Maintain a 30-day learning streak",
      icon: Calendar,
      category: "Consistency",
      requirement: 30,
      current: Math.min(userStats.streak, 30),
      type: "streak",
      difficulty: "hard",
      points: 300,
      earned: userStats.streak >= 30
    },
    {
      id: 6,
      title: "Learning Legend",
      description: "Maintain a 100-day learning streak",
      icon: Award,
      category: "Consistency",
      requirement: 100,
      current: Math.min(userStats.streak, 100),
      type: "streak",
      difficulty: "legendary",
      points: 1000,
      earned: userStats.streak >= 100
    },
    {
      id: 7,
      title: "Road Runner",
      description: "Complete your first roadmap",
      icon: BookOpen,
      category: "Milestones",
      requirement: 1,
      current: Math.min(userStats.roadmapsCompleted || 0, 1),
      type: "roadmaps",
      difficulty: "medium",
      points: 100,
      earned: (userStats.roadmapsCompleted || 0) >= 1
    },
    {
      id: 8,
      title: "Path Pioneer",
      description: "Complete 5 different roadmaps",
      icon: Trophy,
      category: "Milestones",
      requirement: 5,
      current: Math.min(userStats.roadmapsCompleted || 0, 5),
      type: "roadmaps",
      difficulty: "hard",
      points: 500,
      earned: (userStats.roadmapsCompleted || 0) >= 5
    },
    {
      id: 9,
      title: "Code Crusader",
      description: "Complete a programming roadmap",
      icon: Code,
      category: "Specialization",
      requirement: 1,
      current: 0, // This would need to track specific roadmap types
      type: "special",
      difficulty: "medium",
      points: 150,
      earned: false
    },
    {
      id: 10,
      title: "Design Dynamo",
      description: "Complete a design roadmap",
      icon: Palette,
      category: "Specialization",
      requirement: 1,
      current: 0,
      type: "special",
      difficulty: "medium",
      points: 150,
      earned: false
    },
    {
      id: 11,
      title: "Research Rockstar",
      description: "Complete a research-based roadmap",
      icon: Globe,
      category: "Specialization",
      requirement: 1,
      current: 0,
      type: "special",
      difficulty: "medium",
      points: 150,
      earned: false
    },
    {
      id: 12,
      title: "Time Traveler",
      description: "Spend 100 hours learning",
      icon: Clock,
      category: "Dedication",
      requirement: 100,
      current: Math.min(userStats.totalStudyTime || 0, 100),
      type: "time",
      difficulty: "hard",
      points: 400,
      earned: (userStats.totalStudyTime || 0) >= 100
    }
  ];

  const categories = ["Getting Started", "Progress", "Consistency", "Milestones", "Specialization", "Dedication"];
  
  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200", 
      hard: "bg-red-100 text-red-800 border-red-200",
      legendary: "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200"
    };
    return colors[difficulty] || colors.medium;
  };

  const getDifficultyPoints = (difficulty) => {
    const points = {
      easy: "10-25 pts",
      medium: "50-150 pts",
      hard: "300-500 pts", 
      legendary: "1000+ pts"
    };
    return points[difficulty] || points.medium;
  };

  const earnedAchievements = allAchievements.filter(a => a.earned);
  const totalPoints = earnedAchievements.reduce((sum, a) => sum + a.points, 0);
  const completionPercentage = (earnedAchievements.length / allAchievements.length) * 100;

  return (
    <div className="space-y-6">
      {/* Achievement Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achievements Earned</p>
                <p className="text-3xl font-bold">{earnedAchievements.length}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-3xl font-bold">{totalPoints}</p>
              </div>
              <Star className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold">{Math.round(completionPercentage)}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Categories */}
      {categories.map(category => {
        const categoryAchievements = allAchievements.filter(a => a.category === category);
        const earnedInCategory = categoryAchievements.filter(a => a.earned).length;

        return (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{category}</CardTitle>
                <Badge variant="secondary">
                  {earnedInCategory} / {categoryAchievements.length}
                </Badge>
              </div>
              <CardDescription>
                {category === "Getting Started" && "Your first steps in the learning journey"}
                {category === "Progress" && "Task completion milestones"}
                {category === "Consistency" && "Daily learning streak achievements"}
                {category === "Milestones" && "Major roadmap completion goals"}
                {category === "Specialization" && "Domain-specific learning achievements"}
                {category === "Dedication" && "Time and effort recognition"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {categoryAchievements.map(achievement => {
                  const Icon = achievement.icon;
                  const progress = achievement.requirement > 0 ? (achievement.current / achievement.requirement) * 100 : 0;

                  return (
                    <div 
                      key={achievement.id}
                      className={`p-4 rounded-lg border transition-all ${
                        achievement.earned ? 'achievement-earned' : 'hover:bg-accent/30'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-lg ${achievement.earned ? 'bg-yellow-100' : 'bg-muted'}`}>
                          <Icon className={`h-6 w-6 ${achievement.earned ? 'text-yellow-600' : 'text-muted-foreground'}`} />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{achievement.title}</h3>
                            <div className="flex items-center space-x-2">
                              {achievement.earned && <Badge className="bg-yellow-100 text-yellow-800">Earned</Badge>}
                              <Badge className={`text-xs border ${getDifficultyColor(achievement.difficulty)}`}>
                                {achievement.difficulty}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          
                          {!achievement.earned && achievement.type !== "special" && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{achievement.current} / {achievement.requirement}</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{achievement.points} points</span>
                            <span>{getDifficultyPoints(achievement.difficulty)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Achievements;
