import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { useWebSocket } from '../hooks/useWebSocket.js'
import { Button } from '../components/ui/Button.jsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx'
import { Progress } from '../components/ui/Progress.jsx'
import RoadmapCard from '../components/roadmap/RoadmapCard.jsx'
import ContributionCalendar from '../components/progress/ContributionCalendar.jsx'
import { Plus, TrendingUp, Target, Trophy, Flame, Brain } from 'lucide-react'
import { progressService } from '../services/progressService.js'
import { db, supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [roadmaps, setRoadmaps] = useState([])
  const [contributionData, setContributionData] = useState([])
  const [loading, setLoading] = useState(true)

  // WebSocket for real-time updates
  const { } = useWebSocket(user?.id, (message) => {
    console.log('Dashboard received message:', message)
    
    if (message.type === 'roadmap_created') {
      setRoadmaps(prev => [message.data, ...prev])
      toast.success('New roadmap created!')
    } else if (message.type === 'progress_updated') {
      loadDashboardData() // Refresh data on progress update
    }
  })

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      const [progressSummary, contributions, userRoadmaps] = await Promise.all([
        progressService.getProgressSummary(user.id),
        progressService.getContributionData(user.id),
        db.getUserRoadmaps(user.id)
      ])

      setStats(progressSummary.stats)
      setContributionData(contributions.contributionData)
      setRoadmaps(userRoadmaps)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoadmap = async (roadmapId) => {
    if (window.confirm('Are you sure you want to delete this roadmap?')) {
      try {
        await supabase.from('roadmaps').delete().eq('id', roadmapId)
        setRoadmaps(prev => prev.filter(r => r.id !== roadmapId))
        toast.success('Roadmap deleted successfully')
      } catch (error) {
        console.error('Error deleting roadmap:', error)
        toast.error('Failed to delete roadmap')
      }
    }
  }

  const handleViewRoadmap = (roadmap) => {
    navigate('/roadmap', { state: { roadmap } })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const recentRoadmaps = roadmaps.slice(0, 6)
  const activeRoadmaps = roadmaps.filter(r => (r.progress_percentage || 0) < 100)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome back, {profile?.full_name || user?.email?.split('@')[0]}! 👋
        </h1>
        <p className="text-gray-600 text-lg">
          Continue your AI-powered learning journey
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats?.currentStreak || 0}
                </p>
                <p className="text-xs text-gray-500">days in a row</p>
              </div>
              <Flame className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasks Completed</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats?.totalTasks || 0}
                </p>
                <p className="text-xs text-gray-500">total solved</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Experience Points</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats?.totalXp || 0}
                </p>
                <p className="text-xs text-gray-500">Level {stats?.currentLevel || 1}</p>
              </div>
              <Trophy className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Roadmaps</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats?.completedRoadmaps || 0}/{stats?.totalRoadmaps || 0}
                </p>
                <p className="text-xs text-gray-500">completed</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Problem Solving Stats - LeetCode Style */}
      <Card>
        <CardHeader>
          <CardTitle>Problem Solving Progress</CardTitle>
          <CardDescription>Your coding journey like LeetCode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats?.problemsDistribution?.easy || 0}
              </div>
              <div className="text-sm text-gray-500">Easy</div>
              <div className="w-full bg-green-100 rounded-full h-2 mt-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {stats?.problemsDistribution?.medium || 0}
              </div>
              <div className="text-sm text-gray-500">Medium</div>
              <div className="w-full bg-yellow-100 rounded-full h-2 mt-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {stats?.problemsDistribution?.hard || 0}
              </div>
              <div className="text-sm text-gray-500">Hard</div>
              <div className="w-full bg-red-100 rounded-full h-2 mt-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {(stats?.problemsDistribution?.easy || 0) + 
                 (stats?.problemsDistribution?.medium || 0) + 
                 (stats?.problemsDistribution?.hard || 0)}
              </div>
              <div className="text-sm text-gray-500">Total Solved</div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <div className="bg-gray-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contribution Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Activity</CardTitle>
          <CardDescription>Your daily contribution calendar like GitHub</CardDescription>
        </CardHeader>
        <CardContent>
          <ContributionCalendar contributionData={contributionData} />
        </CardContent>
      </Card>

      {/* Recent Roadmaps */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Roadmaps</h2>
          <Button asChild>
            <Link to="/generate">
              <Plus className="mr-2 h-4 w-4" />
              Create New Roadmap
            </Link>
          </Button>
        </div>

        {recentRoadmaps.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold">No roadmaps yet</h3>
              <p className="text-gray-600 max-w-md">
                Create your first AI-powered learning roadmap to get started on your journey
              </p>
              <Button asChild size="lg">
                <Link to="/generate">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Roadmap
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentRoadmaps.map(roadmap => (
                <RoadmapCard
                  key={roadmap.id}
                  roadmap={roadmap}
                  onView={handleViewRoadmap}
                  onDelete={handleDeleteRoadmap}
                />
              ))}
            </div>

            {roadmaps.length > 6 && (
              <div className="text-center">
                <Button variant="outline" asChild>
                  <Link to="/roadmaps">View All Roadmaps ({roadmaps.length})</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Actions */}
      {activeRoadmaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {activeRoadmaps.slice(0, 3).map(roadmap => (
                <div
                  key={roadmap.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleViewRoadmap(roadmap)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{roadmap.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Progress value={roadmap.progress_percentage || 0} className="flex-1" />
                      <span className="text-sm text-gray-500">
                        {Math.round(roadmap.progress_percentage || 0)}%
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Continue
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Dashboard
