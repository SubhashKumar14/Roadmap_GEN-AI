import React from 'react';
import { Button } from './ui/Button.jsx';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar.jsx';
import { Badge } from './ui/Badge.jsx';
import { 
  Home, 
  Map, 
  Trophy, 
  User, 
  LogOut, 
  Flame,
  Star
} from 'lucide-react';
import { useAuth } from './auth/AuthProvider.jsx';

const Header = ({ activeTab, onTabChange, userStats }) => {
  const { user, logout } = useAuth();

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "roadmaps", label: "Roadmaps", icon: Map },
    { id: "achievements", label: "Achievements", icon: Trophy },
    { id: "profile", label: "Profile", icon: User },
  ];

  const handleSignOut = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Roadmap AI</h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  onClick={() => onTabChange(item.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Stats */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">{userStats.streak}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Lvl {userStats.level}</span>
              </div>
              <Badge variant="secondary">
                {userStats.experiencePoints} XP
              </Badge>
            </div>

            {/* User Avatar */}
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src={user.profileImage} />
                <AvatarFallback>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
