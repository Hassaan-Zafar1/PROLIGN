import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { tokenManager } from '../utils/tokenManager'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const user = searchParams.get('user')

    if (token && user) {
      try {
        const userData = JSON.parse(decodeURIComponent(user))
        login(userData, token)
        
        const role = userData.role
        if (role === 'mentor') navigate('/mentor/dashboard')
        else if (role === 'mentee') navigate('/mentee/dashboard')
        else if (role === 'admin') navigate('/admin/dashboard')
      } catch (error) {
        console.error('OAuth callback failed:', error)
        navigate('/login')
      }
    } else {
      navigate('/login')
    }
  }, [searchParams, navigate, login])

  return <div>Completing login...</div>
}