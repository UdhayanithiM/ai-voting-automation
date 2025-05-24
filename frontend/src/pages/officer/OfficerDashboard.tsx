import useSWR from 'swr';
import { useState, useEffect } from 'react'; // Added useEffect
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import API from '@/lib/axios';
import { io, Socket } from 'socket.io-client'; // Import io and Socket type

interface QueueToken {
  _id: string;
  tokenNumber: number;
  voterName: string;
  status: 'waiting' | 'completed';
  // Add other fields your backend might send, e.g., selfie if you plan to show it
}

const fetcher = (url: string) => API.get(url).then((res) => res.data);

export default function OfficerDashboard() {
  const { data, mutate: mutateWaitingQueue, isLoading } = useSWR('/queue?status=waiting', fetcher, {
    // refreshInterval: 5000, // We'll rely more on Socket.IO, so this can be removed or reduced
  });

  // Ensure 'tokens' is always an array
  const currentWaitingTokens: QueueToken[] = Array.isArray(data) ? data : [];

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Establish socket connection
    const socket: Socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

    // Listener for new entries
    socket.on('queue:new-entry', (newToken: QueueToken) => {
      console.log('[OfficerDashboard] queue:new-entry received', newToken);
      mutateWaitingQueue((currentData: QueueToken[] | undefined) => {
        const existingTokens = currentData || [];
        // Avoid adding duplicates if already present (e.g., due to race condition with initial fetch)
        if (existingTokens.find(token => token._id === newToken._id)) {
          return existingTokens;
        }
        return [...existingTokens, newToken].sort((a,b) => a.tokenNumber - b.tokenNumber); // Add and sort
      }, false); // Optimistic update, false means don't refetch immediately
    });

    // Listener for completed tokens (remove from waiting list)
    socket.on('queue:token-completed', (completedToken: QueueToken) => {
      console.log('[OfficerDashboard] queue:token-completed received', completedToken);
      mutateWaitingQueue((currentData: QueueToken[] | undefined) => {
        return (currentData || []).filter(token => token._id !== completedToken._id);
      }, false); // Optimistic update
    });

    // Listener for when the entire queue is cleared
    socket.on('queue:cleared', () => {
      console.log('[OfficerDashboard] queue:cleared received');
      mutateWaitingQueue([], false); // Optimistically set to empty array
    });
    
    // Optional: A general update listener as a fallback
    // socket.on('queue:update', () => {
    //   console.log('[OfficerDashboard] queue:update received, refetching waiting queue.');
    //   mutateWaitingQueue(); // This will refetch data from the server
    // });

    // Cleanup on component unmount
    return () => {
      console.log('[OfficerDashboard] Disconnecting socket');
      socket.disconnect();
    };
  }, [mutateWaitingQueue]); // Dependency array for useEffect

  const handleComplete = async (id: string) => {
    try {
      setLoadingId(id);
      await API.patch(`/queue/${id}/complete`);
      // Backend emits 'queue:token-completed' which should handle the UI update.
      // The explicit mutate() here might become redundant but can be kept as a fallback
      // or if immediate feedback before socket event is desired (though less common).
      // For now, we can rely on the socket event. If there's a noticeable delay,
      // we can add mutate() back or refine the socket logic.
      // mutateWaitingQueue(); // Example: if you want to force a refetch
    } catch (error: unknown) {
      console.error('Error completing token:', error);
      alert('Error completing token');
    } finally {
      setLoadingId(null);
    }
  };

  const handleVerifyVoters = () => navigate('/officer/verify');
  const handleViewQueue = () => navigate('/officer/queue');
  const handleViewReports = () => navigate('/officer/reports');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-600 text-white py-4 px-6">
        <h1 className="text-2xl font-bold">Officer Dashboard</h1>
        <p className="mt-1">Welcome, Officer 👮‍♂️</p>
      </header>

      <div className="flex-1 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          What would you like to do?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">Voter Verification</h3>
            <p className="text-sm text-gray-500 mb-4">Scan and verify voter identities.</p>
            <Button className="w-full" onClick={handleVerifyVoters}>
              Start Verification
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">Queue Management</h3>
            <p className="text-sm text-gray-500 mb-4">Track and manage live voter queue.</p>
            <Button className="w-full" onClick={handleViewQueue}>
              View Queue
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">Reports</h3>
            <p className="text-sm text-gray-500 mb-4">View and analyze voting reports.</p>
            <Button className="w-full" onClick={handleViewReports}>
              View Reports
            </Button>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Live Queue</h2>
          {isLoading && currentWaitingTokens.length === 0 ? ( // Show loading only if no data yet
            <p className="text-gray-500">Loading queue...</p>
          ) : currentWaitingTokens.length === 0 ? (
            <p className="text-gray-500">No waiting voters.</p>
          ) : (
            <div className="space-y-4">
              {currentWaitingTokens.map((token) => (
                <div
                  key={token._id}
                  className="border p-4 rounded-xl flex justify-between items-center"
                >
                  <div>
                    <p className="text-lg font-semibold">Token #{token.tokenNumber}</p>
                    <p className="text-gray-600">{token.voterName}</p>
                  </div>
                  <Button
                    onClick={() => handleComplete(token._id)}
                    disabled={loadingId === token._id}
                  >
                    {loadingId === token._id ? 'Completing...' : 'Mark as Done'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="bg-gray-800 text-white py-4 text-center">
        <p>&copy; 2025 eVoting. All rights reserved.</p>
      </footer>
    </div>
  );
}