import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useOfficerAuth } from '@/store/useOfficerAuth'

export default function OfficerLogin() {
  const [officerId, setOfficerId] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const { login } = useOfficerAuth()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    // Fake hardcoded login
    if (officerId === 'officer123' && password === 'password') {
      login() // Zustand: update auth state
      navigate('/officer/dashboard')
    } else {
      alert('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">Officer Login</h1>
        <form className="space-y-4" onSubmit={handleLogin}>
          <Input
            type="text"
            placeholder="Officer ID"
            value={officerId}
            onChange={(e) => setOfficerId(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full">
            Log In
          </Button>
        </form>
      </div>
    </div>
  )
}
