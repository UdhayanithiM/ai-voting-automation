import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client'; // Ensure Socket type is imported
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { useQueueStore } from '@/store/useQueueStore';
import API from '@/lib/axios';

interface QueueToken {
  _id: string;
  tokenNumber: number;
  voterName: string;
  status: 'waiting' | 'completed';
  // Add other fields your backend might send
}

const fetcher = (url: string) => API.get(url).then((res) => res.data);

// Corrected: Use 'unknown' instead of 'any' for the data parameter
const isArray = (data: unknown): data is QueueToken[] => Array.isArray(data);

export default function QueueManagement() {
  const navigate = useNavigate();
  const { setSelectedToken } = useQueueStore();

  // SWR hook for WAITING tokens
  // Added isLoading alias: isLoadingWaiting
  const { 
    data: waitingTokensData, 
    mutate: refreshWaiting, 
    isLoading: isLoadingWaiting 
  } = useSWR('/queue?status=waiting', fetcher, {
    // refreshInterval: 5000, // Consider removing or reducing this due to Socket.IO
  });
  const waitingTokens: QueueToken[] = isArray(waitingTokensData) ? waitingTokensData : [];

  // SWR hook for COMPLETED tokens
  // Added isLoading alias: isLoadingCompleted
  const { 
    data: completedTokensData, 
    mutate: refreshCompleted, 
    isLoading: isLoadingCompleted 
  } = useSWR('/queue?status=completed', fetcher, {
    // refreshInterval: 15000, // Consider removing or reducing
  });
  const completedTokens: QueueToken[] = isArray(completedTokensData) ? completedTokensData : [];

  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const socket: Socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

    socket.on('queue:new-entry', (newToken: QueueToken) => {
      console.log('[QueueManagement] queue:new-entry received', newToken);
      refreshWaiting((currentData: QueueToken[] | undefined) => {
        const existingTokens = currentData || [];
        if (existingTokens.find(token => token._id === newToken._id)) {
          return existingTokens;
        }
        return [...existingTokens, newToken].sort((a,b) => a.tokenNumber - b.tokenNumber);
      }, false);
    });

    socket.on('queue:token-completed', (completedToken: QueueToken) => {
      console.log('[QueueManagement] queue:token-completed received', completedToken);
      refreshWaiting((currentData: QueueToken[] | undefined) => {
        return (currentData || []).filter(token => token._id !== completedToken._id);
      }, false);
      refreshCompleted((currentData: QueueToken[] | undefined) => {
        const existingTokens = currentData || [];
        if (existingTokens.find(token => token._id === completedToken._id)) {
          return existingTokens;
        }
        return [completedToken, ...existingTokens];
      }, false);
    });
    
    socket.on('queue:cleared', () => {
      console.log('[QueueManagement] queue:cleared received');
      refreshWaiting([], false);
      // refreshCompleted([], false); // Optionally clear completed too
    });

    socket.on('queue:update', () => {
      console.log('[QueueManagement] queue:update received. Revalidating lists.');
      refreshWaiting();
      refreshCompleted();
    });

    return () => {
      console.log('[QueueManagement] Disconnecting socket');
      socket.disconnect();
    };
  }, [refreshWaiting, refreshCompleted]);

  const handleComplete = async (id: string) => {
    setLoadingId(id);
    try {
      await API.patch(`/queue/${id}/complete`);
      // UI update will be handled by 'queue:token-completed' socket event
    } catch (error) {
      console.error('Error completing token:', error);
      alert('Error completing token');
    } finally {
      setLoadingId(null);
    }
  };

  const handleClearQueue = async () => {
    const confirmClear = window.confirm('Are you sure you want to clear the entire queue?');
    if (!confirmClear) return;

    try {
      await API.delete('/queue/reset'); // Should trigger 'queue:cleared'
      alert('✅ Queue successfully cleared command sent.');
      // UI update handled by 'queue:cleared' socket event
    } catch (error) {
      console.error('Failed to send clear queue command:', error);
      alert('❌ Failed to send clear queue command.');
    }
  };

  const handleVerifyClick = (token: QueueToken) => {
    setSelectedToken(token);
    navigate('/officer/verify');
  };

  return (
    <div className="min-h-screen p-6 bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Queue Management</h1>

      <div className="flex justify-end mb-4">
        <Button onClick={handleClearQueue} className="bg-red-600 hover:bg-red-700">
          Clear All Queue
        </Button>
      </div>

      {/* Waiting Voters Section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">⏳ Waiting Voters</h2>
        {/* Corrected: Use isLoadingWaiting from the top-level SWR hook */}
        {isLoadingWaiting && waitingTokens.length === 0 ? (
          <p className="text-gray-500">Loading queue...</p>
        ) : !isLoadingWaiting && waitingTokens.length === 0 ? (
          <p className="text-gray-500">No voters in queue.</p>
        ) : (
          <div className="space-y-4">
            {waitingTokens.map((token) => (
              <div
                key={token._id}
                className="flex justify-between items-center border p-4 rounded-xl"
              >
                <div>
                  <p className="text-lg font-semibold">
                    Token #{token.tokenNumber} — {token.voterName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleVerifyClick(token)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Verify
                  </Button>
                  <Button
                    onClick={() => handleComplete(token._id)}
                    disabled={loadingId === token._id}
                  >
                    {loadingId === token._id ? 'Completing...' : 'Mark as Done'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Tokens Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">✅ Completed Voters</h2>
        {/* Corrected: Use isLoadingCompleted from the top-level SWR hook */}
        {isLoadingCompleted && completedTokens.length === 0 ? (
          <p className="text-gray-500">Loading completed tokens...</p>
        ) : !isLoadingCompleted && completedTokens.length === 0 ? (
          <p className="text-gray-500">No completed tokens yet.</p>
        ) : (
          <div className="space-y-2 text-sm text-gray-600">
            {completedTokens.map((token) => (
              <div key={token._id} className="border px-4 py-2 rounded-md">
                Token #{token.tokenNumber} — {token.voterName}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}