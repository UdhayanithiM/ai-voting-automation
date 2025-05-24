// src/pages/voter/QueueDisplayStubPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useVoterAuth } from '@/store/useVoterAuth';
import API from '@/lib/axios'; // Your Axios instance

interface QueueTokenDetails {
  _id: string;
  tokenNumber: number;
  voterName: string;
  voterId: string;
  status: 'waiting' | 'processing' | 'completed';
  createdAt: string;
  updatedAt: string;
  allottedTime?: string;
  boothNumber?: string;
}

interface QueueSlotResponse {
  success: boolean;
  message: string;
  token: QueueTokenDetails; // This matches your backend response
  // Add other potential top-level fields from backend if any
  voterFullName?: string; // Example, if backend sends this separately
  estimatedWaitTime?: string; // Example, if backend sends this
}

export default function QueueDisplayStubPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const votingToken = useVoterAuth((state) => state.votingToken);
  const otpToken = useVoterAuth((state) => state.otpToken);
  const clearAuth = useVoterAuth((state) => state.clearAuth);

  const [voterDisplayInfo, setVoterDisplayInfo] = useState<string | null>(null);
  const [queuePositionDisplay, setQueuePositionDisplay] = useState<string | null>(null);
  const [estimatedWaitDisplay, setEstimatedWaitDisplay] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!votingToken) {
      alert('Voting session token not found. Please complete face verification.');
      const redirectPath = otpToken ? '/face-verification-stub' : '/voter-id-entry';
      navigate(redirectPath, { state: { from: location }, replace: true });
      setIsLoading(false);
      return;
    }

    const requestQueueSlot = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      try {
        // Ensure the URL is correct (without double /api)
        // The votingToken should be sent by the Axios interceptor in API.defaults.headers.common
        const response = await API.post<QueueSlotResponse>('/queue/request-slot', {});

        if (response.data && response.data.success && response.data.token) {
          const { message, token, voterFullName, estimatedWaitTime } = response.data;
          setSuccessMessage(message || 'Successfully joined the queue!');
          setVoterDisplayInfo(`Voter: ${token.voterName || voterFullName || 'N/A'} (ID: ${token.voterId.slice(-6)})`);
          setQueuePositionDisplay(token.tokenNumber ? `#${token.tokenNumber}` : 'N/A');
          setEstimatedWaitDisplay(estimatedWaitTime || 'Approx. 2-5 minutes (API stub)'); // Use API provided or a default
        } else {
          // Handle cases where response.data or response.data.token might be missing
          setErrorMessage(response.data?.message || 'Queue slot request processed, but data is incomplete.');
          setVoterDisplayInfo("Voter details processing failed.");
          setQueuePositionDisplay("N/A");
          setEstimatedWaitDisplay("N/A");
        }
      } catch (error: any) {
        console.error('Error requesting queue slot:', error);
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const apiErrorMessage = error.response.data?.message || 'An unknown error occurred with the server.';
          setErrorMessage(apiErrorMessage);

          if (error.response.status === 403) {
            if (apiErrorMessage === 'Voter has already voted.' || apiErrorMessage === 'Already voted') {
              alert('This voter has already cast their vote. Redirecting to confirmation.');
              navigate('/confirmation-stub', { replace: true });
              return;
            }
            // Other 403 errors might indicate session issues
            alert(`Session error: ${apiErrorMessage}. Please start over.`);
            clearAuth();
            navigate('/voter-id-entry', { replace: true });
            return;
          }
          if (error.response.status === 401) {
             alert('Your session is invalid or has expired. Please start over.');
             clearAuth();
             navigate('/voter-id-entry', { replace: true });
             return;
          }
           if (error.response.status === 404 && error.request?.responseURL?.includes('/api/api/')) {
            setErrorMessage("Failed to join queue due to a URL configuration issue. Please contact support. (Error 404)");
          }

        } else if (error.request) {
          // The request was made but no response was received
          setErrorMessage('No response from server. Please check your connection or try again later.');
        } else {
          // Something happened in setting up the request that triggered an Error
          setErrorMessage(`Error setting up request: ${error.message}`);
        }
        setVoterDisplayInfo(null);
        setQueuePositionDisplay(null);
        setEstimatedWaitDisplay(null);
      } finally {
        setIsLoading(false);
      }
    };

    requestQueueSlot();
  }, [votingToken, otpToken, navigate, location, clearAuth]);

  const handleProceedToVote = () => {
    if (successMessage && !isLoading && !errorMessage) {
      navigate('/voting-page-stub');
    } else if (!isLoading) {
      alert("Cannot proceed: Queue joining was not successful or is still in progress.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-xl font-semibold">Joining voting queue...</p>
        {/* You can add a spinner component here */}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-100 via-teal-50 to-emerald-100 px-4 py-12 text-center">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8 md:p-10 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Queue Status</h1>

        {errorMessage && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md my-4">
            <p className="font-bold">Error</p>
            <p>{errorMessage}</p>
            <Button onClick={() => navigate('/voter-id-entry', {replace: true})} className="mt-4 w-full py-2 text-sm bg-red-600 hover:bg-red-700 text-white">
                Return to Start
            </Button>
          </div>
        )}

        {successMessage && !errorMessage && (
          <>
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md my-4">
              <p className="font-bold">Verification Successful!</p>
              <p>{successMessage}</p>
              {voterDisplayInfo && <p className="mt-2 text-sm">{voterDisplayInfo}</p>}
            </div>

            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                Your current position is: <span className="font-semibold text-blue-600">{queuePositionDisplay || 'N/A'}</span>
              </p>
              <p className="text-md text-gray-600">
                Estimated wait time: <span className="font-semibold">{estimatedWaitDisplay || 'N/A'}</span>
              </p>
            </div>

            <Button onClick={handleProceedToVote} className="w-full py-3 text-base bg-blue-600 hover:bg-blue-700">
              Proceed to Voting Booth
            </Button>
          </>
        )}
        
        {!successMessage && !errorMessage && !isLoading && (
             <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md my-4">
                 <p className="font-bold">Notice</p>
                 <p>Could not retrieve queue status. Please ensure you have completed all prior steps or try again.</p>
                 <Button onClick={() => {
                    // Attempt to request slot again or redirect
                    if (votingToken) {
                      // Re-trigger the effect by briefly clearing and resetting a dependency if safe,
                      // or ideally, have a dedicated retry function.
                      // For simplicity here, we'll just navigate them to re-initiate the process
                      // if a simple retry isn't easily implemented.
                      // This is a placeholder for a more robust retry.
                       setIsLoading(true); // Show loading while we "retry"
                       const currentPath = location.pathname;
                       navigate('/loading', {replace: true, state: {redirectTo: currentPath}}); // temp loading page
                       setTimeout(() => navigate(currentPath, {replace: true}), 100); // then back to trigger effect
                    } else {
                        navigate('/voter-id-entry', {replace: true});
                    }
                 }} className="mt-2 w-full py-2 text-sm bg-yellow-500 hover:bg-yellow-600">
                    Try Again
                </Button>
                 <Button onClick={() => navigate('/voter-id-entry', {replace: true})} className="mt-2 w-full py-2 text-sm bg-gray-500 hover:bg-gray-600">
                    Return to Start
                </Button>
            </div>
        )}
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Secure eVoting System. All rights reserved.</p>
      </footer>
    </div>
  );
}