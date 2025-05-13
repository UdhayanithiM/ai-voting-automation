import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '@/lib/axios'
import { useVoterAuth } from '@/store/useVoterAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function VerifyOtp() {
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const phone = localStorage.getItem('otpPhone') || ''
  const navigate = useNavigate()
  const { login } = useVoterAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)

    if (value.length === 6) {
      setTimeout(() => {
        handleVerify()
      }, 500)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length === 6) {
      handleVerify()
    }
  }

  const handleVerify = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await API.post('/auth/voter/verify-otp', { phone, otp })
      const { token, user } = res.data

      if (!token || !user) {
        setError('Verification failed: Invalid response from server.')
        setIsLoading(false)
        return
      }

      localStorage.setItem('token', token) // << Added as requested
      login(token, user)
      navigate('/voter-details')
    } catch (err: any) {
      console.error('OTP Verification error:', err)
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        setError('Invalid OTP or server error.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">Verify OTP</h1>
        <p className="text-center text-gray-500 text-sm">Enter the 6-digit code sent to your phone</p>
        {error && (
          <p className="text-red-500 text-center bg-red-100 p-3 rounded-md">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Enter OTP"
            value={otp}
            onChange={handleChange}
            className="tracking-widest text-center text-lg"
            disabled={isLoading}
          />
          <Button type="submit" disabled={otp.length < 6 || isLoading}>
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
        </form>
      </div>
    </div>
  )
}
