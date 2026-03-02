import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Auth from './pages/auth/Auth.jsx'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />

        {/* Redirect root to /auth for now — replace with your landing page later */}
        <Route path="/" element={<Navigate to="/auth" replace />} />

        Add your protected routes here, e.g.:
          <Route path="/dashboard" element={
            <AuthWrapper>
              <Dashboard />
            </AuthWrapper>
          } />
       
      </Routes>
    </Router>
  )
}

export default App
