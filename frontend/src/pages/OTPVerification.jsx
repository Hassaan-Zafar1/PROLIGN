import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuth } from '../context/AuthContext'

export default function OTPVerification() {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const userId = location.state?.userId

  if (!userId) {
    return <div>Invalid request. Please register again.</div>
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authService.verifyOTP(userId, otp)
      login(response.user, response.accessToken)
      
      const role = response.user.role
      if (role === 'mentor') navigate('/mentor/dashboard')
      else if (role === 'mentee') navigate('/mentee/dashboard')
      else if (role === 'admin') navigate('/admin/dashboard')
    } catch (error) {
      console.error('OTP verification failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setResendLoading(true)
    try {
      await authService.resendOTP(userId)
    } catch (error) {
      console.error('Resend OTP failed:', error)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="otp-container">
      <h2>Verify Your Email</h2>
      <p>Enter the 6-digit OTP sent to your email</p>
      <form onSubmit={handleVerifyOTP}>
        <div>
          <label>OTP Code</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.slice(0, 6))}
            placeholder="000000"
            maxLength="6"
            required
          />
        </div>
        <button type="submit" disabled={loading || otp.length !== 6}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>
      <button onClick={handleResendOTP} disabled={resendLoading} className="resend-btn">
        {resendLoading ? 'Resending...' : 'Resend OTP'}
      </button>
    </div>
  )
}