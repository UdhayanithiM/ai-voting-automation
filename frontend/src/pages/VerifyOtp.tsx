import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '@/lib/axios'
import { useVoterAuth } from '@/store/useVoterAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function VerifyOtp() {
  const [otp, setOtp] = useState('')
  const phone = localStorage.getItem('otpPhone') || ''
  const navigate = useNavigate()
  const { login } = useVoterAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)

    // Optionally navigate when OTP is complete
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
    try {
      const res = await API.post('/auth/voter/verify-otp', { phone, otp })
      login(res.data.token, res.data.voter)
      navigate('/voter-details')
    } catch (err) {
      console.error(err)
      alert('Invalid OTP')
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">Verify OTP</h1>
        <p className="text-center text-gray-500 text-sm">Enter the 6-digit code sent to your phone</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Enter OTP"
            value={otp}
            onChange={handleChange}
            className="tracking-widest text-center text-lg"
          />
          <Button type="submit" disabled={otp.length < 6}>
            Verify
          </Button>
        </form>
      </div>
    </div>
  )
}
