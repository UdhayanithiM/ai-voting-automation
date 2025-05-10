import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import API from '@/lib/axios'
import { useAdminAuth } from '@/store/useAdminAuth'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { login } = useAdminAuth()

  const handleLogin = async () => {
    try {
      const res = await API.post('/auth/admin/login', { email, password })
      const { token, admin } = res.data
      login(token, admin) // ✅ Zustand login
      localStorage.setItem('token', token) // Store token in localStorage
      navigate('/admin/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      alert('Invalid credentials or server error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Login</h1>
      <div className="w-full max-w-sm space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button onClick={handleLogin} className="w-full">
          Login
        </Button>
      </div>
    </div>
  )
}
