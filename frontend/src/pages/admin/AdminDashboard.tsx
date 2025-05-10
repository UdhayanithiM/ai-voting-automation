import useSWR from 'swr'
import { useNavigate } from 'react-router-dom'
import API from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import { useAdminAuth } from '@/store/useAdminAuth'

const fetcher = (url: string) => {
  const token = useAdminAuth.getState().token || localStorage.getItem('token')
  return API.get(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).then(res => res.data)
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useSWR('/admin/stats', fetcher)

  if (isLoading) return <p className="text-center mt-4">Loading stats...</p>
  if (error) return <p className="text-center mt-4 text-red-500">Failed to load stats</p>

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Manage voting activity and monitor progress</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-md rounded-xl p-4">
          <h2 className="text-lg font-semibold text-gray-700">🧍 Total Voters</h2>
          <p className="text-3xl font-bold text-blue-600">{data?.totalVoters}</p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-4">
          <h2 className="text-lg font-semibold text-gray-700">🧑‍💼 Total Officers</h2>
          <p className="text-3xl font-bold text-green-600">{data?.totalOfficers}</p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-4">
          <h2 className="text-lg font-semibold text-gray-700">🗳️ Total Votes</h2>
          <p className="text-3xl font-bold text-yellow-500">{data?.totalVotes}</p>
        </div>
      </div>

      {/* Officer Management Section */}
      <div className="bg-white p-6 rounded-lg shadow-md text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-700">Officer Management</h3>
        <p className="text-sm text-gray-500 mb-4">Register new officers for polling booths.</p>
        <Button className="w-full" onClick={() => navigate('/admin/register-officer')}>
          Register Officer
        </Button>
      </div>

      <div className="mt-auto">
        <Button onClick={() => navigate('/admin/dashboard/results')}>
          View Results & Logs
        </Button>
      </div>
    </div>
  )
}
