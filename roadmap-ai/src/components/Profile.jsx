import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card.jsx';
import { Button } from './ui/Button.jsx';
import { Input } from './ui/Input.jsx';
import { Label } from './ui/Label.jsx';
import { Textarea } from './ui/Textarea.jsx';
import { Badge } from './ui/Badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs.jsx';
import { Switch } from './ui/Switch.jsx';
import { Separator } from './ui/Separator.jsx';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar.jsx';
import { 
  User, 
  Key, 
  Settings, 
  Trophy, 
  Calendar,
  Github,
  Twitter,
  MapPin,
  Mail,
  Star,
  Flame,
  Target,
  Brain,
  Sparkles,
  Search,
  Eye,
  EyeOff,
  Save,
  Edit
} from 'lucide-react';
import { useAuth } from './auth/AuthProvider.jsx';
import { userService, progressService } from '../services/api.js';
import { toast } from '../hooks/use-toast.js';
import ContributionCalendar from './ContributionCalendar.jsx';

const Profile = ({ user, userStats }) => {
  const { updateProfile, updateApiKey } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: user.name || '',
    bio: user.bio || '',
    location: user.location || '',
    githubUsername: user.githubUsername || '',
    twitterUsername: user.twitterUsername || '',
    learningGoals: user.learningGoals || [],
    preferences: user.preferences || {
      emailNotifications: true,
      weeklyDigest: true,
      achievementAlerts: true,
      theme: 'light'
    }
  });
  const [showApiKeys, setShowApiKeys] = useState({
    openai: false,
    gemini: false,
    perplexity: false
  });
  const [tempApiKeys, setTempApiKeys] = useState({
    openai: '',
    gemini: '',
    perplexity: ''
  });
  const [activityData, setActivityData] = useState([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    if (user) {
      loadActivityData();
      loadAchievements();
    }
  }, [user]);

  const loadActivityData = async () => {
    try {
      setIsLoadingActivity(true);
      const activity = await progressService.getActivity();

      // Transform backend data to component format
      const formattedActivity = activity.activityData?.map((day) => ({
        date: day.date,
        count: day.count || 0,
        level: day.level || 0
      })) || [];

      setActivityData(formattedActivity);
    } catch (error) {
      console.error('Error loading activity data:', error);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const loadAchievements = async () => {
    try {
      const data = await progressService.getAchievements();
      setAchievements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading achievements:', error);
      setAchievements([]);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile(editedProfile);
      if (result.success) {
        setIsEditing(false);
        toast({
          title: "Profile Updated",
          description: "Your profile has been saved successfully.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveApiKey = async (provider) => {
    if (!tempApiKeys[provider]) {
      toast({
        title: "API Key Required",
        description: "Please enter an API key.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await updateApiKey(provider, tempApiKeys[provider]);
      if (result.success) {
        toast({
          title: "API Key Updated",
          description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API key has been saved securely.`,
        });
        setTempApiKeys(prev => ({ ...prev, [provider]: '' }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleApiKeyVisibility = (provider) => {
    setShowApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const providerInfo = {
    openai: {
      icon: Brain,
      name: "OpenAI",
      description: "For technical and programming roadmaps",
      color: "text-green-600",
      placeholder: "sk-..."
    },
    gemini: {
      icon: Sparkles,
      name: "Google Gemini",
      description: "For creative and design roadmaps",
      color: "text-blue-600",
      placeholder: "AIza..."
    },
    perplexity: {
      icon: Search,
      name: "Perplexity AI",
      description: "For research and current trends",
      color: "text-purple-600",
      placeholder: "pplx-..."
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.profileImage} />
              <AvatarFallback className="text-2xl">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold">{editedProfile.name}</h1>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                
                {editedProfile.bio && (
                  <p className="mt-2 text-muted-foreground">{editedProfile.bio}</p>
                )}
                
                <div className="flex items-center space-x-4 mt-2">
                  {editedProfile.location && (
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{editedProfile.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3" />
                  Level {userStats.level}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Flame className="h-3 w-3" />
                  {userStats.streak} day streak
                </Badge>
                <Badge variant="outline">
                  Rank #{userStats.globalRanking?.toLocaleString() || 'Unranked'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your profile information and social links</CardDescription>
                </div>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                >
                  {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={editedProfile.name}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={editedProfile.location}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editedProfile.bio}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  disabled={!isEditing}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub Username</Label>
                  <div className="flex items-center space-x-2">
                    <Github className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="github"
                      value={editedProfile.githubUsername}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, githubUsername: e.target.value }))}
                      placeholder="username"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter Username</Label>
                  <div className="flex items-center space-x-2">
                    <Twitter className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="twitter"
                      value={editedProfile.twitterUsername}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, twitterUsername: e.target.value }))}
                      placeholder="username"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Learning Activity</CardTitle>
              <CardDescription>
                Track your daily learning progress and maintain your streak. Just like on LeetCode!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActivity ? (
                <div className="flex items-center justify-center py-8">
                  <div className="loading-spinner w-8 h-8" />
                  <p className="ml-4">Loading your activity...</p>
                </div>
              ) : (
                <ContributionCalendar data={activityData} />
              )}

              {/* Additional Activity Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.totalCompleted}</div>
                  <div className="text-sm text-muted-foreground">Total Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.roadmapsCompleted || 0}</div>
                  <div className="text-sm text-muted-foreground">Roadmaps Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{Math.round((userStats.totalStudyTime || 0) / 60)}h</div>
                  <div className="text-sm text-muted-foreground">Study Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.streak}</div>
                  <div className="text-sm text-muted-foreground">Current Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider API Keys</CardTitle>
              <CardDescription>
                Add your API keys to use your own quota for AI roadmap generation. 
                When rate limits are reached, these keys will be used instead of the default ones.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(providerInfo).map(([provider, info]) => (
                <Card key={provider}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 rounded-lg bg-muted">
                        {React.createElement(info.icon, { className: `h-6 w-6 ${info.color}` })}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold">{info.name}</h3>
                          <p className="text-sm text-muted-foreground">{info.description}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`${provider}-key`}>API Key</Label>
                          <div className="flex space-x-2">
                            <div className="relative flex-1">
                              <Input
                                id={`${provider}-key`}
                                type={showApiKeys[provider] ? "text" : "password"}
                                value={tempApiKeys[provider]}
                                onChange={(e) => setTempApiKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                                placeholder={info.placeholder}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                                onClick={() => toggleApiKeyVisibility(provider)}
                              >
                                {showApiKeys[provider] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <Button onClick={() => handleSaveApiKey(provider)}>
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">🔒 Security Note</h4>
                  <p className="text-sm text-muted-foreground">
                    Your API keys are encrypted and stored securely. They are only used when our default quota is exhausted 
                    or when you specifically request to use your own keys. We never share or misuse your API keys.
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Achievements</CardTitle>
                  <CardDescription>{achievements.length} achievements earned</CardDescription>
                </div>
                <Badge variant="secondary">
                  {achievements.length} / 12
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {achievements.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No achievements yet</h3>
                    <p className="text-muted-foreground">Complete tasks and maintain streaks to earn your first achievement!</p>
                  </div>
                ) : (
                  achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-4 p-4 rounded-lg border achievement-earned">
                      <div className="p-2 rounded-lg bg-yellow-100">
                        <Trophy className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        {achievement.earnedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Earned on {new Date(achievement.earnedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Earned
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your learning experience and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">Receive emails about your progress and achievements</p>
                </div>
                <Switch
                  checked={editedProfile.preferences?.emailNotifications}
                  onCheckedChange={(checked) => 
                    setEditedProfile(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, emailNotifications: checked }
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Weekly Digest</h4>
                  <p className="text-sm text-muted-foreground">Get a summary of your weekly learning progress</p>
                </div>
                <Switch
                  checked={editedProfile.preferences?.weeklyDigest}
                  onCheckedChange={(checked) => 
                    setEditedProfile(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, weeklyDigest: checked }
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Achievement Alerts</h4>
                  <p className="text-sm text-muted-foreground">Get notified when you earn new badges and achievements</p>
                </div>
                <Switch
                  checked={editedProfile.preferences?.achievementAlerts}
                  onCheckedChange={(checked) => 
                    setEditedProfile(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, achievementAlerts: checked }
                    }))
                  }
                />
              </div>

              <Separator />

              <Button onClick={handleSaveProfile} className="w-full">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
