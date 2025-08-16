import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { Button } from '../ui/Button.jsx'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar.jsx'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { User, Settings, LogOut, Menu, Brain } from 'lucide-react'

const Header = () => {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Roadmap AI
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <Link to="/roadmaps" className="text-sm font-medium hover:text-blue-600 transition-colors">
            Roadmaps
          </Link>
          <Link to="/generate" className="text-sm font-medium hover:text-blue-600 transition-colors">
            Generate
          </Link>
          <Link to="/progress" className="text-sm font-medium hover:text-blue-600 transition-colors">
            Progress
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-56 bg-white rounded-md border shadow-lg p-1 z-50" align="end">
                  <DropdownMenu.Item className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded" onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded" onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                  <DropdownMenu.Item className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded text-red-600" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/register')}>
                Sign Up
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="flex flex-col space-y-2 p-4">
            <Link to="/dashboard" className="text-sm font-medium hover:text-blue-600 py-2 transition-colors">
              Dashboard
            </Link>
            <Link to="/roadmaps" className="text-sm font-medium hover:text-blue-600 py-2 transition-colors">
              Roadmaps
            </Link>
            <Link to="/generate" className="text-sm font-medium hover:text-blue-600 py-2 transition-colors">
              Generate
            </Link>
            <Link to="/progress" className="text-sm font-medium hover:text-blue-600 py-2 transition-colors">
              Progress
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header
