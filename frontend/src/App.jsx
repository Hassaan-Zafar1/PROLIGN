import { Routes, Route } from 'react-router-dom'
import './App.css'
import Landing from './pages/Landing'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import MentorRegistration from './pages/MentorRegistration'

/**
 * Main App Router
 * Routes:
 * / - Landing page
 * /login - Login page (unified for all roles)
 * /signup - Mentee registration
 * /mentor-registration - Mentor registration
 * 
 * TODO: Add routes for:
 * - /mentee-dashboard - Mentee dashboard
 * - /mentor-dashboard - Mentor dashboard
 * - /admin-dashboard - Admin dashboard
 * - /mentors - Browse mentors
 * - /mentees - Browse mentees (for mentors)
 * - /session/:id - Session details
 * - /profile/:id - User profile view
 */

function App() {
  return (
    <div className="App bg-background min-h-screen text-on-surface">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/mentor-registration" element={<MentorRegistration />} />
        
        {/* TODO: Add additional routes */}
        {/* <Route path="/mentee-dashboard" element={<MenteeDashboard />} />
        <Route path="/mentor-dashboard" element={<MentorDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/mentors" element={<MentorBrowse />} />
        <Route path="/mentees" element={<MenteeBrowse />} />
        <Route path="/session/:id" element={<SessionDetail />} />
        <Route path="/profile/:id" element={<UserProfile />} /> */}
      </Routes>
    </div>
  )
}

export default App