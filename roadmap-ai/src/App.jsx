import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '.useAuth.js'
import Header from '.Header.jsx'

// Pages
import Dashboard from '.Dashboard.jsx'
import Login from '.Login.jsx'
import Register from '.Register.jsx'
import GeneratePage from '.GeneratePage.jsx'
import RoadmapPage from '.RoadmapPage.jsx'
import RoadmapsPage from '.RoadmapsPage.jsx'

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" />
}

// App layout with header
const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <main className="container mx-auto py-8 px-4 max-w-7xl">
      {children}
    </main>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/generate" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <GeneratePage />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/roadmap" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <RoadmapPage />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/roadmaps" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <RoadmapsPage />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
          </Routes>
          <Toaster 
            position="top-right" 
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
