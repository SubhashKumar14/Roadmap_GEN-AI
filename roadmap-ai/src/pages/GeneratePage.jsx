import { useNavigate } from 'react-router-dom'
import RoadmapGenerator from '../components/roadmap/RoadmapGenerator.jsx'

const GeneratePage = () => {
  const navigate = useNavigate()

  const handleRoadmapCreated = (roadmap) => {
    navigate('/roadmap', { state: { roadmap } })
  }

  const handleBack = () => {
    navigate('/dashboard')
  }

  return (
    <RoadmapGenerator 
      onRoadmapCreated={handleRoadmapCreated}
      onBack={handleBack}
    />
  )
}

export default GeneratePage
