// src/pages/Login.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function Login() {
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!mobile) return

    setLoading(true)
    // Simulate API delay
    setTimeout(() => {
      setLoading(false)
      navigate('/verify-otp') // We'll build this next
    }, 1500)
  }

  return (
    <div className="h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">Login</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            placeholder="Enter your mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </Button>
        </form>
      </div>
    </div>
  )
}
