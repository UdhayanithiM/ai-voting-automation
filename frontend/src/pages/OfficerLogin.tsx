import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useOfficerAuth } from '@/store/useOfficerAuth'
import API from '@/lib/axios'

export default function OfficerLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { login } = useOfficerAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await API.post('/auth/officer/login', { email, password })
      const token = res.data.token
      localStorage.setItem('officerToken', token)
      login()
      navigate('/officer/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      alert('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">Officer Login</h1>
        <form className="space-y-4" onSubmit={handleLogin}>
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" className="w-full">Log In</Button>
        </form>
      </div>
    </div>
  )
}
