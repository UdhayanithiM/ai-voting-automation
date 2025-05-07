import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAdminAuth } from '@/store/useAdminAuth'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  // Get login and auth state from the store
  const login = useAdminAuth((state) => state.login)
 


  const handleLogin = () => {
    // Check credentials and authenticate through the store
    if (username === 'admin' && password === 'password') {
      login() // Update the auth state in the store
      navigate('/admin/dashboard') // Redirect to admin dashboard
    } else {
      alert('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Login</h1>

      <div className="w-full max-w-sm space-y-4">
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
