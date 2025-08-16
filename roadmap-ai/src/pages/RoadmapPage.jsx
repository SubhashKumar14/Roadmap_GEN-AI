import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import RoadmapViewer from '../components/roadmap/RoadmapViewer.jsx'
import { db } from '../lib/supabase.js'

const RoadmapPage = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [roadmap, setRoadmap] = useState(location.state?.roadmap)
  const [loading, setLoading] = useState(!roadmap)

  useEffect(() => {
    // If no roadmap in state, try to get from URL params
    const searchParams = new URLSearchParams(location.search)
    const roadmapId = searchParams.get('id')
    
    if (!roadmap && roadmapId && user) {
      loadRoadmap(roadmapId)
    } else if (!roadmap && !roadmapId) {
      navigate('/dashboard')
    }
  }, [location, roadmap, user, navigate])

  const loadRoadmap = async (roadmapId) => {
    try {
      const roadmapData = await db.getRoadmap(roadmapId)
      if (roadmapData.user_id !== user.id) {
        navigate('/dashboard')
        return
      }
      setRoadmap(roadmapData)
    } catch (error) {
      console.error('Error loading roadmap:', error)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!roadmap) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Roadmap not found</p>
      </div>
    )
  }

  return <RoadmapViewer roadmap={roadmap} onBack={handleBack} />
}

export default RoadmapPage
