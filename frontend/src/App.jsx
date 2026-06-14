import { Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import MentorRegistration from './pages/MentorRegistration'

function App() {
  return (
    <div className="App">
      <nav>
        <Link to="/">Login</Link>
        <Link to="/signup">Sign Up</Link>
        <Link to="/mentor-registration">Mentor Registration</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/mentor-registration" element={<MentorRegistration />} />
      </Routes>
    </div>
  )
}

export default App