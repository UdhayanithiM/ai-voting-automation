import { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import type { VoterRecord } from '@/store/useAdminStore'

export default function VoterTable() {
  const { voters, approveVoter, flagVoter, loadDummyData } = useAdminStore()

  const [selected, setSelected] = useState<VoterRecord | null>(null) // Use VoterRecord instead of any
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadDummyData()
  }, [loadDummyData])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Registered Voters</h1>
      <p className="text-gray-500 mb-6">This is where admin can view, verify, or flag voters.</p>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 shadow-md rounded-xl overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voter ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DOB</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selfie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {voters.map((voter) => (
              <tr key={voter.voterId}>
                <td className="px-6 py-4">{voter.fullName}</td>
                <td className="px-6 py-4">{voter.voterId}</td>
                <td className="px-6 py-4">{voter.dob}</td>
                <td className="px-6 py-4">
                  <img
                    src={voter.selfie}
                    alt="Selfie"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      voter.status === 'Verified'
                        ? 'bg-green-100 text-green-800'
                        : voter.status === 'Flagged'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {voter.status}
                  </span>
                </td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => {
                      setSelected(voter)
                      setIsModalOpen(true)
                    }}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View
                  </button>
                  <button
                    onClick={() => approveVoter(voter.voterId)}
                    className="text-green-600 hover:underline text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => flagVoter(voter.voterId)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Flag
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Viewing Voter Details */}
      {isModalOpen && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">Voter Details</h2>
            <p>
              <strong>Name:</strong> {selected.fullName}
            </p>
            <p>
              <strong>Voter ID:</strong> {selected.voterId}
            </p>
            <p>
              <strong>DOB:</strong> {selected.dob}
            </p>
            <div className="my-4">
              <strong>Selfie:</strong>
              <img
                src={selected.selfie}
                alt="Selfie"
                className="mt-2 w-32 h-32 rounded-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
