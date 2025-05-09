import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAdminAuth } from '@/store/useAdminAuth'
import API from '@/lib/axios'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const login = useAdminAuth((state) => state.login)

  const handleLogin = async () => {
    try {
      const res = await API.post('/auth/admin/login', { email, password })
      const token = res.data.token
      localStorage.setItem('adminToken', token)
      login()
      navigate('/admin/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      alert('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Login</h1>
      <div className="w-full max-w-sm space-y-4">
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button onClick={handleLogin} className="w-full">Login</Button>
      </div>
    </div>
  )
}
