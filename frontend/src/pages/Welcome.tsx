// src/pages/Welcome.tsx

import { useNavigate } from 'react-router-dom'
import logo from '@/assets/logo.svg'
import { Button } from '@/components/ui/Button'

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-white px-6 py-12">
      {/* Logo + Welcome Text */}
      <div className="text-center space-y-6 mt-12">
        <img src={logo} alt="Voting Logo" className="h-16 mx-auto" />
        <h1 className="text-3xl font-bold text-gray-900">Welcome to eVoting</h1>
        <p className="text-gray-600 text-base">Please select how you want to log in</p>
      </div>

      {/* Buttons */}
      <div className="space-y-4 w-full max-w-md mt-10">
        <Button className="w-full" onClick={() => navigate('/voter-id-entry')}>
          Voter Login
        </Button>
        <Button
          className="w-full bg-gray-100 text-gray-800 hover:bg-gray-200"
          onClick={() => navigate('/officer/login')}
        >
          Officer Login
        </Button>
        <Button
          className="w-full bg-gray-100 text-gray-800 hover:bg-gray-200"
          onClick={() => navigate('/admin/login')}
        >
          Admin Login
        </Button>
      </div>
    </div>
  )
}
