import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { ArrowRight, Brain, Sparkles, Search, Zap, Target, Users, TrendingUp } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Generation",
      description: "Choose from OpenAI, Gemini, or Perplexity to generate personalized learning roadmaps"
    },
    {
      icon: Target,
      title: "A2Z Striver Format",
      description: "Roadmaps structured like competitive programming sheets with modules and difficulty-based tasks"
    },
    {
      icon: TrendingUp,
      title: "Real-time Progress",
      description: "GitHub-style contribution calendar with streak tracking and achievement system"
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Share roadmaps, fork from others, and learn together in a collaborative environment"
    }
  ];

  const aiProviders = [
    {
      name: "OpenAI GPT-4",
      icon: Brain,
      description: "Best for technical and programming topics",
      color: "text-green-600",
      badge: "bg-green-100 text-green-800"
    },
    {
      name: "Google Gemini", 
      icon: Sparkles,
      description: "Excellent for creative and design topics",
      color: "text-blue-600",
      badge: "bg-blue-100 text-blue-800"
    },
    {
      name: "Perplexity AI",
      icon: Search,
      description: "Perfect for current trends and research",
      color: "text-purple-600",
      badge: "bg-purple-100 text-purple-800"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <h1 className="text-xl font-bold">Roadmap AI</h1>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Zap className="w-3 h-3 mr-1" />
            AI-Powered Learning Platform
          </Badge>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            Create Your Perfect
            <span className="text-primary"> Learning Journey</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Generate personalized learning roadmaps using AI, track your progress like a pro, 
            and achieve your goals with our A2Z Striver-style platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild>
              <Link to="/register">
                Start Learning Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold">3</div>
              <div className="text-sm text-muted-foreground">AI Providers</div>
            </div>
            <div>
              <div className="text-3xl font-bold">∞</div>
              <div className="text-sm text-muted-foreground">Learning Paths</div>
            </div>
            <div>
              <div className="text-3xl font-bold">100%</div>
              <div className="text-sm text-muted-foreground">Real-time Tracking</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Providers Section */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powered by Leading AI</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from the best AI providers based on your learning topic. 
              Each AI specializes in different domains for optimal results.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {aiProviders.map((provider) => (
              <Card key={provider.name} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4">
                    {React.createElement(provider.icon, { 
                      className: `h-12 w-12 ${provider.color}` 
                    })}
                  </div>
                  <CardTitle>{provider.name}</CardTitle>
                  <CardDescription>{provider.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From AI-powered roadmap generation to real-time progress tracking, 
              we've got all the tools you need for effective learning.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of learners who are achieving their goals with AI-powered roadmaps. 
            Start your journey today, completely free.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/register">
              Create Your First Roadmap
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4">
              <h3 className="font-semibold">Roadmap AI</h3>
              <Badge variant="outline">Beta</Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-4 md:mt-0">
              © 2025 Roadmap AI. Built with ❤️ for learners.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
