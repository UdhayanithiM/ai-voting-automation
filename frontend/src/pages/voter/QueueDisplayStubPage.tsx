// src/pages/voter/QueueDisplayStubPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useVoterAuth } from '@/store/useVoterAuth';
import API from '@/lib/axios'; // Your Axios instance
import axios, { AxiosError } from 'axios'; // <<<< IMPORT axios and AxiosError

interface QueueTokenDetails {
  _id: string;
  tokenNumber: number;
  voterName?: string;
  voterId: string;
  status: 'waiting' | 'processing' | 'completed';
  createdAt: string;
  updatedAt: string;
  allottedTime?: string;
  boothNumber?: string;
}

// Add a type for the error response from the backend if it's consistent
interface ErrorResponseData {
    message?: string;
    error?: string; // if your backend sometimes uses 'error' key
}

interface QueueSlotResponse {
  success: boolean;
  message: string;
  token?: QueueTokenDetails;
  voterFullName?: string;
  estimatedWaitTime?: string;
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

  const requestQueueSlot = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!votingToken) {
      setErrorMessage('Voting session token is invalid. Please start over.');
      setIsLoading(false);
      setTimeout(() => {
        clearAuth();
        navigate('/voter-id-entry', { replace: true });
      }, 2000);
      return;
    }

    try {
      const response = await API.post<QueueSlotResponse>('/queue/request-slot', {});

      if (response.data && response.data.success && response.data.token) {
        const { message, token, voterFullName, estimatedWaitTime } = response.data;
        setSuccessMessage(message || 'Successfully joined the voting queue!');
        setVoterDisplayInfo(`Voter: ${voterFullName || token.voterName || 'Details N/A'} (ID ending: ...${token.voterId.slice(-4)})`);
        setQueuePositionDisplay(token.tokenNumber ? `#${token.tokenNumber}` : 'N/A');
        setEstimatedWaitDisplay(estimatedWaitTime || 'A few minutes');
      } else {
        setErrorMessage(response.data?.message || 'Failed to join queue or received incomplete data.');
      }
    } catch (error: unknown) { // <<<< CHANGED from 'any' to 'unknown' (Fix for ESLint error at line 74)
      console.error('Error requesting queue slot:', error);
      let apiErrorMessage = 'An unknown error occurred.';

      if (axios.isAxiosError(error)) { // Use imported axios.isAxiosError
        const axiosError = error as AxiosError<ErrorResponseData>; // Use imported AxiosError
        apiErrorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || 'An unknown server error occurred.';
        
        if (axiosError.response) {
          setErrorMessage(apiErrorMessage);
          if (axiosError.response.status === 403) {
            if (apiErrorMessage.includes('voted')) { // Check for specific "already voted" messages
              alert('This voter has already cast their vote. Redirecting to confirmation.');
              navigate('/confirmation-stub', { replace: true });
              return;
            }
            alert(`Session error: ${apiErrorMessage}. Please start over.`);
            clearAuth();
            navigate('/voter-id-entry', { replace: true });
            return;
          }
          if (axiosError.response.status === 401) {
            alert('Your session is invalid or has expired. Please start over.');
            clearAuth();
            navigate('/voter-id-entry', { replace: true });
            return;
          }
          if (axiosError.response.status === 404 && axiosError.request?.responseURL?.includes('/api/api/')) {
            setErrorMessage("Failed to join queue due to a URL configuration issue. Please contact support. (Error 404)");
          }
        } else if (axiosError.request) {
          setErrorMessage('No response from server. Please check your connection or try again later.');
        } else {
          setErrorMessage(`Error setting up request: ${axiosError.message}`);
        }
      } else if (error instanceof Error) {
        setErrorMessage(`An unexpected error occurred: ${error.message}`);
      } else {
        setErrorMessage(apiErrorMessage); // Fallback for non-Axios/non-Error objects
      }
      
      setVoterDisplayInfo(null);
      setQueuePositionDisplay(null);
      setEstimatedWaitDisplay(null);
    } finally {
      setIsLoading(false);
    }
  }, [votingToken, navigate, clearAuth]); // Removed location and otpToken if not directly used by this callback's logic

  useEffect(() => {
    if (!votingToken) {
      alert('Voting session token not found. Please complete face verification.');
      const redirectPath = otpToken ? '/face-verification-stub' : '/voter-id-entry';
      navigate(redirectPath, { state: { from: location }, replace: true });
      setIsLoading(false);
      return;
    }
    requestQueueSlot();
  }, [votingToken, otpToken, requestQueueSlot, navigate, location]); // requestQueueSlot is a dependency

  const handleProceedToVote = () => {
    if (successMessage && !isLoading && !errorMessage) {
      navigate('/voting-page-stub');
    } else if (!isLoading) {
      alert("Cannot proceed: Queue joining was not successful, is still in progress, or encountered an error.");
    }
  };

  const handleRetry = () => {
      if (votingToken) {
          requestQueueSlot();
      } else {
          alert("Session expired. Redirecting to start.");
          clearAuth();
          navigate('/voter-id-entry', {replace: true});
      }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-semibold text-blue-700">Joining voting queue...</p>
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
            <Button onClick={handleRetry} className="mt-4 w-full py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white">
              Try Again
            </Button>
            <Button onClick={() => { clearAuth(); navigate('/voter-id-entry', {replace: true}); }} className="mt-2 w-full py-2 text-sm bg-red-600 hover:bg-red-700 text-white">
              Return to Start
            </Button>
          </div>
        )}

        {successMessage && !errorMessage && (
          <>
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md my-4">
              <p className="font-bold">Success!</p>
              <p>{successMessage}</p>
              {voterDisplayInfo && <p className="mt-2 text-sm">{voterDisplayInfo}</p>}
            </div>

            <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-lg text-gray-700">
                Your Queue Number: <span className="font-semibold text-blue-600 text-xl">{queuePositionDisplay || 'N/A'}</span>
              </p>
              <p className="text-md text-gray-600">
                Estimated Wait Time: <span className="font-semibold">{estimatedWaitDisplay || 'Calculating...'}</span>
              </p>
            </div>

            <Button onClick={handleProceedToVote} className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white">
              Proceed to Voting Booth
            </Button>
          </>
        )}
        
        {!isLoading && !errorMessage && !successMessage && (
             <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md my-4">
                <p className="font-bold">Status Unavailable</p>
                <p>Could not retrieve queue status. Please try again.</p>
                <Button onClick={handleRetry} className="mt-2 w-full py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white">
                  Retry Request
                </Button>
                 <Button onClick={() => { clearAuth(); navigate('/voter-id-entry', {replace: true}); }} className="mt-2 w-full py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white">
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