import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '@/lib/axios'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return

    setLoading(true)
    try {
      await API.post('/auth/voter/send-otp', { phone })
      localStorage.setItem('otpPhone', phone)
      navigate('/verify-otp')
    } catch (err) {
      console.error(err)
      alert('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">Voter Login</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            type="tel"
            placeholder="Enter your mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </Button>
        </form>
      </div>
    </div>
  )
}
