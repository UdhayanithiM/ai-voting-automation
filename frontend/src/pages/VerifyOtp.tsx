import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios, { AxiosError } from 'axios'
import API from '@/lib/axios'
import { useVoterAuth } from '@/store/useVoterAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ErrorResponseData {
  message: string
}

export default function VerifyOtp() {
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const { login } = useVoterAuth()

  // Retrieve stored phone or other identifiers
  const phone = localStorage.getItem('otpPhone') || ''
  const aadharNumber = localStorage.getItem('aadharNumberForOtp')
  const registerNumber = localStorage.getItem('registerNumberForOtp')

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
      await handleVerify()
    } else {
      setError('OTP must be 6 digits.')
    }
  }

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('OTP must be 6 digits.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Change endpoint based on the flow you're using
      const response = await API.post('/auth/voter/verify-otp', {
        phone,
        otp,
        aadharNumber,
        registerNumber,
      })

      const { token, user, sessionToken, voterInfo } = response.data

      // If token + user available, log in
      if (token && user) {
        localStorage.setItem('token', token)
        login(token, user)
        navigate('/voter-details')
      }

      // Optional: If using sessionToken for face verification
      else if (sessionToken && voterInfo) {
        localStorage.setItem('faceVerificationToken', sessionToken)
        // Save voterInfo in Zustand or localStorage as needed
        navigate('/face-verification')
      }

      else {
        setError('Verification failed: Invalid response from server.')
      }
    } catch (err) {
      console.error('OTP Verification error:', err)
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ErrorResponseData>
        if (axiosError.response?.data?.message) {
          setError(axiosError.response.data.message)
        } else {
          setError('Invalid OTP or server error. Please try again.')
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unknown error occurred during OTP verification.')
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
