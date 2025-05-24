import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import API from '@/lib/axios';
import { io, Socket } from 'socket.io-client';
import { useOfficerAuthStatus } from '@/store/useOfficerAuth';

interface QueueToken {
  _id: string;
  tokenNumber: number;
  voterName: string;
  status: 'waiting' | 'completed';
}

const fetcher = (url: string) => API.get(url).then((res) => res.data);

export default function OfficerDashboard() {
  const { isAuthenticated, _hasHydrated } = useOfficerAuthStatus();
  const { data, mutate: mutateWaitingQueue, isLoading } = useSWR('/queue?status=waiting', fetcher);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
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
  }, [mutateWaitingQueue]);

  if (!_hasHydrated) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/officer/login" replace />;
  }

  const currentWaitingTokens: QueueToken[] = Array.isArray(data) ? data : [];

  const handleComplete = async (id: string) => {
    try {
      setLoadingId(id);
      await API.patch(`/queue/${id}/complete`);
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
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">Voter Verification</h3>
            <Button className="w-full" onClick={handleVerifyVoters}>
              Start Verification
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">Queue Management</h3>
            <Button className="w-full" onClick={handleViewQueue}>
              View Queue
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">Reports</h3>
            <Button className="w-full" onClick={handleViewReports}>
              View Reports
            </Button>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Live Queue</h2>
          {isLoading && currentWaitingTokens.length === 0 ? (
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