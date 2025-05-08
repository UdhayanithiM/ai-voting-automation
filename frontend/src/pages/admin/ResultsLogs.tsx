import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

const dummyResults = {
  totalVotes: 124,
  totalFlagged: 3,
  totalVerified: 121,
  logs: [
    {
      voterId: 'AB123456',
      name: 'Ravi Kumar',
      status: 'Voted',
      time: '10:12 AM',
    },
    {
      voterId: 'CD789012',
      name: 'Sita Devi',
      status: 'Flagged',
      time: '10:20 AM',
    },
    {
      voterId: 'EF345678',
      name: 'Mohammed Ali',
      status: 'Voted',
      time: '10:30 AM',
    },
  ],
}

export default function ResultsLogs() {
  useEffect(() => {
    // In real app: fetch logs from backend API
  }, [])

  return (
    <div className="min-h-screen bg-white px-6 py-10 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Results & Logs</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div className="p-6 bg-blue-100 rounded-xl">
          <p className="text-sm text-gray-600">Total Votes</p>
          <p className="text-2xl font-bold text-blue-700">{dummyResults.totalVotes}</p>
        </div>
        <div className="p-6 bg-green-100 rounded-xl">
          <p className="text-sm text-gray-600">Verified Voters</p>
          <p className="text-2xl font-bold text-green-700">{dummyResults.totalVerified}</p>
        </div>
        <div className="p-6 bg-red-100 rounded-xl">
          <p className="text-sm text-gray-600">Flagged</p>
          <p className="text-2xl font-bold text-red-700">{dummyResults.totalFlagged}</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-700 mt-8 mb-4">Voter Logs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border divide-y divide-gray-200">
            <thead className="bg-gray-50 text-left text-sm text-gray-600">
              <tr>
                <th className="px-4 py-2">Voter ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white text-sm divide-y divide-gray-100">
              {dummyResults.logs.map((log, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">{log.voterId}</td>
                  <td className="px-4 py-2">{log.name}</td>
                  <td className="px-4 py-2">{log.status}</td>
                  <td className="px-4 py-2">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Button onClick={() => window.print()}>Print Report</Button>
    </div>
  )
}
