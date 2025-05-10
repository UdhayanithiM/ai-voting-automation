import useSWR from 'swr'
import API from '@/lib/axios'
import { useState } from 'react'

interface Voter {
  _id: string
  fullName: string
  voterId: string
  dob: string
  selfie?: string
  createdAt: string
  status?: 'Verified' | 'Flagged' | 'Pending'
}

const fetcher = (url: string) => API.get(url).then((res) => res.data)

export default function VoterTable() {
  const { data: voters = [], isLoading, mutate } = useSWR<Voter[]>('/admin/voters', fetcher)
  const [selected, setSelected] = useState<Voter | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Approve a voter
  const approveVoter = async (voterId: string) => {
    try {
      await API.post(`admin/voters/${voterId}/approve`)
      mutate() // Refresh data after action
    } catch (error) {
      if (error instanceof Error) {
        alert(`Error approving voter: ${error.message}`)
      } else {
        alert('Error approving voter')
      }
    }
  }

  // Flag a voter
  const flagVoter = async (voterId: string) => {
    try {
      const reason = window.prompt('Please enter reason for flagging:')
      if (reason === null) return // User cancelled
      
      await API.post(`/admin/voters/${voterId}/flag`, { reason })
      mutate() // Refresh data
    } catch (error) {
      if (error instanceof Error) {
        console.error('Flagging failed:', error.message)
        alert(`Flagging failed: ${error.message}`)
      } else {
        console.error('Flagging failed:', error)
        alert('Flagging failed')
      }
    }
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">🗳 Voter Records</h1>
      <p className="text-gray-500 mb-6">This is where admin can view, verify, or flag voters.</p>

      {isLoading ? (
        <p className="text-gray-500">Loading voters...</p>
      ) : voters.length === 0 ? (
        <p className="text-gray-500">No voter records found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border shadow-md">
          <table className="min-w-full text-sm text-left divide-y divide-gray-200">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Voter ID</th>
                <th className="px-4 py-3">DOB</th>
                <th className="px-4 py-3">Selfie</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y">
              {voters.map((voter, idx) => (
                <tr key={voter._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2 font-medium">{voter.fullName}</td>
                  <td className="px-4 py-2">{voter.voterId}</td>
                  <td className="px-4 py-2">{voter.dob}</td>
                  <td className="px-4 py-2">
                    {voter.selfie ? (
                      <img
                        src={voter.selfie}
                        alt="Selfie"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        voter.status === 'Verified'
                          ? 'bg-green-100 text-green-800'
                          : voter.status === 'Flagged'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {voter.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-2">{new Date(voter.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 space-x-2">
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
                      onClick={() => approveVoter(voter._id)}
                      className="text-green-600 hover:underline text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => flagVoter(voter._id)}
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
      )}

      {isModalOpen && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">Voter Details</h2>
            <p><strong>Name:</strong> {selected.fullName}</p>
            <p><strong>Voter ID:</strong> {selected.voterId}</p>
            <p><strong>DOB:</strong> {selected.dob}</p>
            <p><strong>Status:</strong> {selected.status || 'Pending'}</p>
            <div className="my-4">
              <strong>Selfie:</strong>
              {selected.selfie ? (
                <img
                  src={selected.selfie}
                  alt="Selfie"
                  className="mt-2 w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <p className="text-gray-500">No selfie uploaded.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}