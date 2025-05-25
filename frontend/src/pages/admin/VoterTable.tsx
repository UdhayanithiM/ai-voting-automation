// frontend/src/pages/admin/VoterTable.tsx
import useSWR from 'swr';
import API from '@/lib/axios'; // Use the global API instance
import { useState } from 'react';
import { useAdminAuth } from '@/store/useAdminAuth'; // For conditional fetching
import { Button } from '@/components/ui/Button'; // Assuming you have this
import axios from 'axios'; // For AxiosError type

interface Voter {
  _id: string;
  fullName: string;
  voterId: string; // Assuming this is the general ID, not a specific type like Aadhaar
  dob: string;
  selfie?: string;
  createdAt: string;
  status?: 'Verified' | 'Flagged' | 'Pending' | string; // Allow string for flexibility if backend sends other statuses
  approved?: boolean;
  flagged?: boolean;
  flagReason?: string;
  // Add other fields like aadharNumber, voterIdNumber, registerNumber if they come from backend
}

// Updated SWR fetcher to use the global API instance
const swrFetcher = (url: string) => API.get(url).then((res) => res.data);

export default function VoterTable() {
  const { token: adminToken /* Implement _hasHydrated in useAdminAuth for robustness */ } = useAdminAuth(state => ({ token: state.token }));
  
  const { data: voters = [], error: votersError, isLoading, mutate } = useSWR<Voter[]>(
    adminToken ? '/admin/voters' : null, // Conditional fetching
    swrFetcher
  );

  const [selected, setSelected] = useState<Voter | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Approve a voter
  const approveVoter = async (voterId: string) => {
    setActionError(null);
    try {
      await API.post(`/admin/voters/${voterId}/approve`); // Added leading slash
      mutate(); // Refresh data after action
    } catch (error) {
      console.error('Error approving voter:', error);
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setActionError(`Error approving voter: ${error.response.data.message}`);
      } else if (error instanceof Error) {
        setActionError(`Error approving voter: ${error.message}`);
      } else {
        setActionError('An unknown error occurred while approving voter.');
      }
    }
  };

  // Flag a voter
  const flagVoter = async (voterId: string) => {
    setActionError(null);
    try {
      const reason = window.prompt('Please enter reason for flagging:');
      if (reason === null) return; // User cancelled
      
      await API.post(`/admin/voters/${voterId}/flag`, { reason }); // Added leading slash
      mutate(); // Refresh data
    } catch (error) {
      console.error('Flagging failed:', error);
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setActionError(`Flagging failed: ${error.response.data.message}`);
      } else if (error instanceof Error) {
        setActionError(`Flagging failed: ${error.message}`);
      } else {
        setActionError('An unknown error occurred while flagging voter.');
      }
    }
  };

  if (!adminToken /* && !_hasHydrated */) {
    // This case should ideally be handled by ProtectedAdminRoute after hydration logic is added to useAdminAuth
    // For now, it prevents SWR from running without a token if useAdminAuth hasn't initialized.
    return <p className="text-center mt-4">Authenticating...</p>;
  }

  if (isLoading) return <p className="text-gray-500 text-center mt-4">Loading voters...</p>;
  if (votersError) return <p className="text-red-500 text-center mt-4">Failed to load voters: {votersError.message}</p>;

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">🗳 Voter Records</h1>
      <p className="text-gray-500 mb-6">This is where admin can view, verify, or flag voters.</p>

      {actionError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md mb-4">
          <p>{actionError}</p>
        </div>
      )}

      {voters.length === 0 && !isLoading ? (
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
                        voter.status === 'Verified' || voter.approved === true
                          ? 'bg-green-100 text-green-800'
                          : voter.status === 'Flagged' || voter.flagged === true
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {voter.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-2">{new Date(voter.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 space-x-2">
                    <Button
                      onClick={() => {
                        setSelected(voter);
                        setIsModalOpen(true);
                      }}
                      variant="link" // Assuming a link variant for less prominent action
                      className="text-blue-600 hover:underline text-sm p-1"
                    >
                      View
                    </Button>
                    <Button
                      onClick={() => approveVoter(voter._id)}
                      variant="link"
                      className="text-green-600 hover:underline text-sm p-1"
                      disabled={voter.approved || voter.status === 'Verified'}
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => flagVoter(voter._id)}
                      variant="link"
                      className="text-red-600 hover:underline text-sm p-1"
                      disabled={voter.flagged || voter.status === 'Flagged'}
                    >
                      Flag
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
              aria-label="Close modal"
            >
              &times;
            </button>

            <h2 className="text-xl font-bold mb-4">Voter Details</h2>
            <p><strong>Name:</strong> {selected.fullName}</p>
            <p><strong>Voter ID:</strong> {selected.voterId}</p>
            <p><strong>DOB:</strong> {selected.dob}</p>
            <p><strong>Status:</strong> {selected.status || 'Pending'}</p>
            {selected.flagged && selected.flagReason && <p><strong>Flag Reason:</strong> {selected.flagReason}</p>}
            <div className="my-4">
              <strong>Selfie:</strong>
              {selected.selfie ? (
                <img
                  src={selected.selfie}
                  alt="Selfie"
                  className="mt-2 w-32 h-32 rounded-full object-cover border"
                />
              ) : (
                <p className="text-gray-500 mt-1">No selfie uploaded.</p>
              )}
            </div>
            <Button onClick={() => setIsModalOpen(false)} className="mt-4 w-full">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}