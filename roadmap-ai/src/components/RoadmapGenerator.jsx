import React, { useState } from 'react';
import { Button } from './ui/Button.jsx';
import { Input } from './ui/Input.jsx';
import { Label } from './ui/Label.jsx';
import { Textarea } from './ui/Textarea.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Progress } from './ui/Progress.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select.jsx';
import { Loader2, Brain, Sparkles, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from './auth/AuthProvider.jsx';
import { aiService } from '../services/api.js';
import { toast } from '../hooks/use-toast.js';

const RoadmapGenerator = ({ onRoadmapGenerated, onBack }) => {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [aiProvider, setAiProvider] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [recommendedProvider, setRecommendedProvider] = useState(null);

  const handleTopicChange = async (value) => {
    setTopic(value);
    
    // Get AI provider recommendation
    if (value.length > 3) {
      try {
        const result = await aiService.classifyTopic(value);
        setRecommendedProvider(result.recommendedProvider);
      } catch (error) {
        console.error('Error classifying topic:', error);
      }
    }
  };

  const generateRoadmap = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for your learning roadmap.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setCurrentStep("Analyzing topic...");

    try {
      // Step 1: Analyze topic
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Select AI provider
      setCurrentStep("Selecting best AI provider...");
      setProgress(40);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: Generate roadmap structure
      setCurrentStep("Generating roadmap structure...");
      setProgress(60);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Adding modules and tasks
      setCurrentStep("Adding modules and tasks...");
      setProgress(80);

      console.log('🚀 Generating roadmap for topic:', topic, 'with AI provider:', aiProvider || recommendedProvider);
      const roadmap = await aiService.generateRoadmap(topic, aiProvider || recommendedProvider, difficulty);
      console.log('✅ Roadmap generated:', roadmap);

      // Step 5: Finalizing
      setCurrentStep("Finalizing roadmap...");
      setProgress(95);
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(100);
      setCurrentStep("Complete!");

      // Add additional metadata if provided
      if (description) {
        roadmap.description = description;
      }

      onRoadmapGenerated(roadmap);

      toast({
        title: "Roadmap Generated! 🎉",
        description: `Your "${roadmap.title}" roadmap is ready. Generated using ${roadmap.aiProvider?.toUpperCase() || 'AI'}.`,
      });

    } catch (error) {
      console.error('Error generating roadmap:', error);

      let errorMessage = "Failed to generate roadmap. Please try again.";

      if (error.response?.status === 404) {
        errorMessage = "AI service temporarily unavailable. Please try again later.";
      } else if (error.response?.status === 429) {
        errorMessage = "Rate limit reached. Please try again in a few minutes or add your API keys in the profile.";
      } else if (error.message?.includes('API key')) {
        errorMessage = "AI service configuration issue. Please check your API keys in the profile section.";
      }

      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setCurrentStep("");
    }
  };

  const providerInfo = {
    openai: {
      icon: Brain,
      name: "OpenAI GPT-4",
      description: "Best for technical and programming topics",
      color: "text-green-600",
      badge: "bg-green-100 text-green-800"
    },
    gemini: {
      icon: Sparkles,
      name: "Google Gemini",
      description: "Excellent for creative and design topics",
      color: "text-blue-600",
      badge: "bg-blue-100 text-blue-800"
    },
    perplexity: {
      icon: Search,
      name: "Perplexity AI",
      description: "Perfect for current trends and research",
      color: "text-purple-600",
      badge: "bg-purple-100 text-purple-800"
    }
  };

  const exampleTopics = [
    "Full-Stack Web Development",
    "Machine Learning Fundamentals", 
    "Data Structures and Algorithms",
    "React.js Development",
    "Python Programming",
    "UI/UX Design Mastery",
    "Digital Marketing Strategy",
    "Cloud Computing with AWS"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold">AI Roadmap Generator</h2>
            <p className="text-muted-foreground">Create personalized learning paths powered by advanced AI</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Your Learning Roadmap</CardTitle>
          <CardDescription>
            Choose your AI provider and let our advanced algorithms create a comprehensive roadmap for you
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Generation in Progress */}
          {isGenerating && (
            <div className="space-y-4 p-6 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Generating your roadmap...</h3>
                <div className="loading-spinner w-6 h-6" />
              </div>
              
              <Progress value={progress} className="w-full" />
              
              <p className="text-sm text-muted-foreground">{currentStep}</p>
              
              {recommendedProvider && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Using:</span>
                  <Badge className={providerInfo[recommendedProvider]?.badge}>
                    {React.createElement(providerInfo[recommendedProvider]?.icon || Brain, { className: "h-3 w-3 mr-1" })}
                    {providerInfo[recommendedProvider]?.name}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Generation Form */}
          {!isGenerating && (
            <div className="space-y-6">
              {/* AI Provider Selection */}
              <div className="space-y-3">
                <Label>Select AI Provider</Label>
                <div className="grid gap-4">
                  {Object.entries(providerInfo).map(([key, info]) => (
                    <Card 
                      key={key} 
                      className={`cursor-pointer transition-all ${
                        aiProvider === key ? 'ring-2 ring-primary' : ''
                      } ${recommendedProvider === key ? 'border-primary' : ''}`}
                      onClick={() => setAiProvider(key)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          {React.createElement(info.icon, { className: `h-6 w-6 ${info.color}` })}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{info.name}</h4>
                              {recommendedProvider === key && (
                                <Badge variant="secondary">Recommended</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{info.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Topic Input */}
              <div className="space-y-2">
                <Label htmlFor="topic">Learning Topic *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Full-Stack Web Development, Machine Learning, DSA"
                  value={topic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  className="text-base"
                />
                
                {/* AI Provider Recommendation */}
                {recommendedProvider && !aiProvider && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span>Recommended AI:</span>
                    <Badge className={providerInfo[recommendedProvider]?.badge}>
                      {React.createElement(providerInfo[recommendedProvider]?.icon || Brain, { 
                        className: `h-3 w-3 mr-1` 
                      })}
                      {providerInfo[recommendedProvider]?.name}
                    </Badge>
                    <span className="text-muted-foreground">- {providerInfo[recommendedProvider]?.description}</span>
                  </div>
                )}
              </div>

              {/* Example Topics */}
              <div className="space-y-2">
                <Label>Popular Topics:</Label>
                <div className="flex flex-wrap gap-2">
                  {exampleTopics.map((example) => (
                    <Badge 
                      key={example}
                      variant="outline" 
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleTopicChange(example)}
                    >
                      {example}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Additional Context (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Any specific requirements, goals, or context for your learning journey..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Generate Button */}
              <Button 
                onClick={generateRoadmap} 
                className="w-full" 
                size="lg"
                disabled={!topic.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Roadmap'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoadmapGenerator;
