// frontend/src/pages/officer/OfficerDashboard.tsx
import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import API from '@/lib/axios';
import { io, Socket } from 'socket.io-client';
// Import the store hook directly and use granular selections
import { useOfficerAuth } from '@/store/useOfficerAuth'; 

interface QueueToken {
  _id: string;
  tokenNumber: number;
  voterName: string;
  status: 'waiting' | 'completed';
}

const fetcher = (url: string) => API.get(url).then((res) => res.data);

export default function OfficerDashboard() {
  const isAuthenticated = useOfficerAuth((state) => !!state.token);
  const hasHydrated = useOfficerAuth((state) => state._hasHydrated);
  // const officerInfo = useOfficerAuth((state) => state.officer); // Example if needed

  const { data, mutate: mutateWaitingQueue, isLoading: isQueueLoading, error: queueError } = useSWR(
    isAuthenticated && hasHydrated ? '/queue?status=waiting' : null, // Key changes if auth changes
    fetcher,
    {
        onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
            // Never retry on 401.
            if (error.response?.status === 401) return;
            // Otherwise, use SWR's default retry logic.
            // You can customize further if needed.
            if (retryCount >= 3) return; // Example: Limit retries
            setTimeout(() => revalidate({ retryCount }), 5000); // Example: Retry after 5 seconds
        }
    }
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[OfficerDashboard] Socket useEffect runs. isAuthenticated:', isAuthenticated, 'hasHydrated:', hasHydrated);
    if (!isAuthenticated || !hasHydrated) {
      return; 
    }

    const socket: Socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        // Consider adding auth if your socket server expects it, though usually not for initial connection
        // query: { token: useOfficerAuth.getState().token } // Example, but token might be stale here too
    });
    console.log('[OfficerDashboard] Socket attempting to connect.');

    socket.on('connect', () => console.log('[OfficerDashboard] Socket connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('[OfficerDashboard] Socket disconnected:', reason));
    socket.on('connect_error', (error) => console.error('[OfficerDashboard] Socket connection error:', error));
    
    socket.on('queue:new-entry', (newToken: QueueToken) => {
      console.log('[OfficerDashboard] Socket event: queue:new-entry', newToken);
      mutateWaitingQueue((currentData: QueueToken[] = []) => {
        if (currentData.find(token => token._id === newToken._id)) return currentData;
        return [...currentData, newToken].sort((a,b) => a.tokenNumber - b.tokenNumber);
      }, { revalidate: false }); // Optimistic update, don't revalidate from server
    });

    socket.on('queue:token-completed', (completedToken: QueueToken) => {
      console.log('[OfficerDashboard] Socket event: queue:token-completed', completedToken);
      mutateWaitingQueue((currentData: QueueToken[] = []) => 
        currentData.filter(token => token._id !== completedToken._id), 
      { revalidate: false });
    });

    socket.on('queue:cleared', () => {
      console.log('[OfficerDashboard] Socket event: queue:cleared');
      mutateWaitingQueue([], { revalidate: false });
    });

    return () => {
      console.log('[OfficerDashboard] Cleanup: Socket disconnecting.');
      socket.disconnect();
    };
  }, [isAuthenticated, hasHydrated, mutateWaitingQueue]);

  if (!hasHydrated) {
    console.log('[OfficerDashboard] Store not hydrated yet. Showing Loading...');
    return <div className="flex justify-center items-center min-h-screen">Loading Authentication Data...</div>;
  }

  if (!isAuthenticated) {
    console.log('[OfficerDashboard] Not authenticated. Redirecting to login.');
    return <Navigate to="/officer/login" replace />;
  }
  
  if (queueError) {
      console.error("[OfficerDashboard] SWR error fetching queue:", queueError);
      // If 401, logout would have been triggered by interceptor leading to !isAuthenticated and redirect.
      // This handles other SWR errors.
      return <div className="text-red-500 p-4">Error loading queue data. Please try refreshing. Details: {queueError.message}</div>;
  }

  console.log('[OfficerDashboard] Authenticated and hydrated. Rendering dashboard content.');
  const currentWaitingTokens: QueueToken[] = Array.isArray(data) ? data : [];

  const handleComplete = async (id: string) => {
    setLoadingId(id);
    try {
      await API.patch(`/queue/${id}/complete`);
    } catch (error) {
      console.error('Error completing token:', error);
      alert('Error completing token. Please try again.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleVerifyVoters = () => navigate('/officer/verify');
  const handleViewQueue = () => navigate('/officer/queue');
  const handleViewReports = () => navigate('/officer/reports');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header, Main, Footer structure as in your previous version */}
      <header className="bg-blue-600 text-white py-4 px-6 shadow-md">
        <h1 className="text-2xl font-bold">Officer Dashboard</h1>
        <p className="mt-1">Welcome, Officer 👮‍♂️</p>
      </header>

      <main className="flex-1 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Officer Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Voter Verification</h3>
            <Button className="w-full mt-2" onClick={handleVerifyVoters}>Start Verification</Button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Queue Management</h3>
            <Button className="w-full mt-2" onClick={handleViewQueue}>View Full Queue</Button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Reports & Logs</h3>
            <Button className="w-full mt-2" onClick={handleViewReports}>View Reports</Button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Live Waiting Queue</h2>
          {isQueueLoading && !queueError && currentWaitingTokens.length === 0 ? (
            <p className="text-gray-500">Loading queue...</p>
          ) : !queueError && currentWaitingTokens.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No voters currently waiting in the queue.</p>
          ) : !queueError ? (
            <div className="space-y-4">
              {currentWaitingTokens.map((token) => (
                <div key={token._id} className="border p-4 rounded-xl shadow-sm flex justify-between items-center bg-gray-50">
                  <div>
                    <p className="text-lg font-semibold text-blue-700">Token #{token.tokenNumber}</p>
                    <p className="text-gray-600">{token.voterName}</p>
                  </div>
                  <Button
                    onClick={() => handleComplete(token._id)}
                    disabled={loadingId === token._id}
                    variant={loadingId === token._id ? "outline" : "default"}
                  >
                    {loadingId === token._id ? 'Completing...' : 'Mark as Done'}
                  </Button>
                </div>
              ))}
            </div>
          ) : null /* Error case already handled above */} 
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-4 text-center mt-auto">
        <p>&copy; {new Date().getFullYear()} AI Voting Automation. All rights reserved.</p>
      </footer>
    </div>
  );
}