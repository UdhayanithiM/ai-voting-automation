import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function AdminDashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Manage voting activity and monitor progress</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-md rounded-xl p-4">
          <h2 className="text-lg font-semibold text-gray-700">Total Voters</h2>
          <p className="text-3xl font-bold text-blue-600">1,234</p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-4">
          <h2 className="text-lg font-semibold text-gray-700">Verified</h2>
          <p className="text-3xl font-bold text-green-600">987</p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-4">
          <h2 className="text-lg font-semibold text-gray-700">Pending</h2>
          <p className="text-3xl font-bold text-yellow-500">247</p>
        </div>
      </div>

      <div className="mt-auto">
        <Button onClick={() => navigate('/admin/dashboard/results')}>
          View Results & Logs
        </Button>
      </div>
    </div>
  )
}
