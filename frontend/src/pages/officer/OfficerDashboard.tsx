import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

const OfficerDashboard = () => {
  const navigate = useNavigate()

  const handleVerifyVoters = () => {
    navigate('/officer/verify')
  }

  const handleViewQueue = () => {
    navigate('/officer/queue')
  }

  const handleViewReports = () => {
    navigate('/officer/reports') // Make sure to implement this route if needed
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4 px-6">
        <h1 className="text-2xl font-bold">Officer Dashboard</h1>
        <p className="mt-1">Welcome, Officer 👮‍♂️</p>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          What would you like to do?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Voter Verification */}
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">Voter Verification</h3>
            <p className="text-sm text-gray-500 mb-4">Scan and verify voter identities.</p>
            <Button className="w-full" onClick={handleVerifyVoters}>
              Start Verification
            </Button>
          </div>

          {/* Queue Management */}
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">Queue Management</h3>
            <p className="text-sm text-gray-500 mb-4">Track and manage live voter queue.</p>
            <Button className="w-full" onClick={handleViewQueue}>
              View Queue
            </Button>
          </div>

          {/* Reports */}
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">Reports</h3>
            <p className="text-sm text-gray-500 mb-4">View and analyze voting reports.</p>
            <Button className="w-full" onClick={handleViewReports}>
              View Reports
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4 text-center">
        <p>&copy; 2025 eVoting. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default OfficerDashboard
