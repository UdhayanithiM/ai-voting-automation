// frontend/src/pages/officer/OfficerDashboard.tsx
import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import API from '@/lib/axios';
import { io, Socket } from 'socket.io-client';
import { useOfficerAuthStatus } from '@/store/useOfficerAuth'; // Correct import

interface QueueToken {
  _id: string;
  tokenNumber: number;
  voterName: string;
  status: 'waiting' | 'completed';
}

const fetcher = (url: string) => API.get(url).then((res) => res.data);

export default function OfficerDashboard() {
  // Correctly destructure hasHydrated (no underscore)
  const { isAuthenticated, hasHydrated } = useOfficerAuthStatus(); 
  const { data, mutate: mutateWaitingQueue, isLoading: isQueueLoading } = useSWR( // Renamed isLoading to avoid conflict
    isAuthenticated && hasHydrated ? '/queue?status=waiting' : null, // Conditionally fetch
    fetcher
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !hasHydrated) return; // Don't setup socket if not authenticated/hydrated

    const socket: Socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

    socket.on('queue:new-entry', (newToken: QueueToken) => {
      mutateWaitingQueue((currentData: QueueToken[] | undefined) => {
        const existingTokens = currentData || [];
        if (existingTokens.find(token => token._id === newToken._id)) {
          return existingTokens;
        }
        return [...existingTokens, newToken].sort((a,b) => a.tokenNumber - b.tokenNumber);
      }, false);
    });

    socket.on('queue:token-completed', (completedToken: QueueToken) => {
      mutateWaitingQueue((currentData: QueueToken[] | undefined) => {
        return (currentData || []).filter(token => token._id !== completedToken._id);
      }, false);
    });

    socket.on('queue:cleared', () => {
      mutateWaitingQueue([], false);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, hasHydrated, mutateWaitingQueue]); // Add isAuthenticated and hasHydrated

  if (!hasHydrated) { // Check hasHydrated first
    console.log('[OfficerDashboard] Store not hydrated yet. Showing Loading...');
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) { // Then check isAuthenticated
    console.log('[OfficerDashboard] Not authenticated. Redirecting to login.');
    return <Navigate to="/officer/login" replace />;
  }

  // If we reach here, user is authenticated and store is hydrated
  console.log('[OfficerDashboard] Authenticated and hydrated. Rendering dashboard content.');

  const currentWaitingTokens: QueueToken[] = Array.isArray(data) ? data : [];

  const handleComplete = async (id: string) => {
    try {
      setLoadingId(id);
      await API.patch(`/queue/${id}/complete`);
      // mutateWaitingQueue(); // Optionally re-fetch or optimistically update
    } catch (error) {
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
        <h2 className="text-xl font-semibold text-gray-800 mb-6">What would you like to do?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Action Cards */}
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">Voter Verification</h3>
            <Button className="w-full mt-2" onClick={handleVerifyVoters}>Start Verification</Button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">Queue Management</h3>
            <Button className="w-full mt-2" onClick={handleViewQueue}>View Queue</Button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">Reports</h3>
            <Button className="w-full mt-2" onClick={handleViewReports}>View Reports</Button>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Live Queue</h2>
          {isQueueLoading && currentWaitingTokens.length === 0 ? (
            <p className="text-gray-500">Loading queue...</p>
          ) : currentWaitingTokens.length === 0 ? (
            <p className="text-gray-500">No waiting voters.</p>
          ) : (
            <div className="space-y-4">
              {currentWaitingTokens.map((token) => (
                <div key={token._id} className="border p-4 rounded-xl flex justify-between items-center">
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