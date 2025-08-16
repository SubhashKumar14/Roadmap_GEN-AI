import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { Button } from '.Button.jsx'
import { Card, CardContent } from '..Card.jsx'
import RoadmapCard from '../components/roadmap/RoadmapCard.jsx'
import { Plus, Filter, Search } from 'lucide-react'
import { db, supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'

const RoadmapsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [roadmaps, setRoadmaps] = useState([])
  const [filteredRoadmaps, setFilteredRoadmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, active, completed

  useEffect(() => {
    if (user) {
      loadRoadmaps()
    }
  }, [user])

  useEffect(() => {
    filterRoadmaps()
  }, [roadmaps, searchTerm, filterStatus])

  const loadRoadmaps = async () => {
    try {
      const userRoadmaps = await db.getUserRoadmaps(user.id)
      setRoadmaps(userRoadmaps)
    } catch (error) {
      console.error('Error loading roadmaps:', error)
      toast.error('Failed to load roadmaps')
    } finally {
      setLoading(false)
    }
  }

  const filterRoadmaps = () => {
    let filtered = [...roadmaps]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(roadmap =>
        roadmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roadmap.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(roadmap => {
        const progress = roadmap.progress_percentage || 0
        if (filterStatus === 'completed') return progress === 100
        if (filterStatus === 'active') return progress > 0 && progress < 100
        if (filterStatus === 'not-started') return progress === 0
        return true
      })
    }

    setFilteredRoadmaps(filtered)
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
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Roadmaps</h1>
          <p className="text-gray-600">Manage your AI-generated learning paths</p>
        </div>
        <Button asChild>
          <Link to="/generate">
            <Plus className="mr-2 h-4 w-4" />
            Create New Roadmap
          </Link>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search roadmaps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roadmaps</option>
            <option value="active">In Progress</option>
            <option value="completed">Completed</option>
            <option value="not-started">Not Started</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{roadmaps.length}</div>
            <div className="text-sm text-gray-500">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {roadmaps.filter(r => (r.progress_percentage || 0) === 100).length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {roadmaps.filter(r => {
                const progress = r.progress_percentage || 0
                return progress > 0 && progress < 100
              }).length}
            </div>
            <div className="text-sm text-gray-500">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {roadmaps.filter(r => (r.progress_percentage || 0) === 0).length}
            </div>
            <div className="text-sm text-gray-500">Not Started</div>
          </CardContent>
        </Card>
      </div>

      {/* Roadmaps Grid */}
      {filteredRoadmaps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No roadmaps match your criteria' : 'No roadmaps yet'}
            </h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search terms or filters'
                : 'Create your first AI-powered learning roadmap to get started'
              }
            </p>
            {(!searchTerm && filterStatus === 'all') && (
              <Button asChild>
                <Link to="/generate">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Roadmap
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoadmaps.map(roadmap => (
            <RoadmapCard
              key={roadmap.id}
              roadmap={roadmap}
              onView={handleViewRoadmap}
              onDelete={handleDeleteRoadmap}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default RoadmapsPage
