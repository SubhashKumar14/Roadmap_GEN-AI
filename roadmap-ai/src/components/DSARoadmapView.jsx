import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card.jsx';
import { Button } from './ui/Button.jsx';
import { Progress } from './ui/Progress.jsx';
import { Checkbox } from './ui/Checkbox.jsx';
import { Badge } from './ui/Badge.jsx';
import { Separator } from './ui/Separator.jsx';
import { ArrowLeft, BookOpen, Clock, Target, Video, FileText, Code2 } from 'lucide-react';

const DSARoadmapView = ({ roadmap, onTaskComplete, onBack }) => {
  const [expandedModules, setExpandedModules] = useState(new Set());

  const toggleModule = (moduleId) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getTaskIcon = (task) => {
    if (task.type === 'video') return <Video className="w-4 h-4" />;
    if (task.type === 'reading') return <FileText className="w-4 h-4" />;
    if (task.type === 'coding') return <Code2 className="w-4 h-4" />;
    return <BookOpen className="w-4 h-4" />;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateModuleProgress = (module) => {
    if (!module.tasks || module.tasks.length === 0) return 0;
    const completedTasks = module.tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / module.tasks.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{roadmap.title}</h1>
          <p className="text-muted-foreground">{roadmap.description}</p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Overall Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Completion</span>
              <span className="text-sm text-muted-foreground">{Math.round(roadmap.progress || 0)}%</span>
            </div>
            <Progress value={roadmap.progress || 0} className="h-2" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{roadmap.modules?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Modules</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {roadmap.modules?.reduce((total, module) => total + (module.tasks?.length || 0), 0) || 0}
                </div>
                <div className="text-xs text-muted-foreground">Total Tasks</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {roadmap.modules?.reduce((total, module) => 
                    total + (module.tasks?.filter(task => task.completed).length || 0), 0) || 0}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{roadmap.estimatedDuration}</div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <div className="space-y-4">
        {roadmap.modules?.map((module, moduleIndex) => {
          const isExpanded = expandedModules.has(module.id);
          const moduleProgress = calculateModuleProgress(module);

          return (
            <Card key={module.id} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleModule(module.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center space-x-3">
                      <span className="text-sm bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                        {moduleIndex + 1}
                      </span>
                      <span>{module.title}</span>
                    </CardTitle>
                    {module.description && (
                      <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{moduleProgress}%</div>
                      <div className="text-xs text-muted-foreground">
                        {module.tasks?.filter(task => task.completed).length || 0} / {module.tasks?.length || 0}
                      </div>
                    </div>
                    <Progress value={moduleProgress} className="w-20 h-2" />
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="space-y-3">
                    {module.tasks?.map((task, taskIndex) => (
                      <div key={task.id} className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <Checkbox
                          checked={task.completed || false}
                          onCheckedChange={() => onTaskComplete(module.id, task.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getTaskIcon(task)}
                              <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                              </h4>
                            </div>
                            <div className="flex items-center space-x-2">
                              {task.difficulty && (
                                <Badge variant="outline" className={getDifficultyColor(task.difficulty)}>
                                  {task.difficulty}
                                </Badge>
                              )}
                              {task.estimatedTime && (
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{task.estimatedTime}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          )}

                          {task.learningObjectives && task.learningObjectives.length > 0 && (
                            <div className="text-xs">
                              <span className="font-medium text-muted-foreground">Learning Objectives:</span>
                              <ul className="list-disc list-inside ml-4 text-muted-foreground">
                                {task.learningObjectives.map((objective, idx) => (
                                  <li key={idx}>{objective}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {task.resources && (task.resources.videos || task.resources.articles || task.resources.practice) && (
                            <div className="text-xs space-y-1">
                              <span className="font-medium text-muted-foreground">Resources:</span>
                              <div className="flex flex-wrap gap-2">
                                {task.resources.videos && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Video className="w-3 h-3 mr-1" />
                                    Videos
                                  </Badge>
                                )}
                                {task.resources.articles && (
                                  <Badge variant="secondary" className="text-xs">
                                    <FileText className="w-3 h-3 mr-1" />
                                    Articles
                                  </Badge>
                                )}
                                {task.resources.practice && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Code2 className="w-3 h-3 mr-1" />
                                    Practice
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DSARoadmapView;
