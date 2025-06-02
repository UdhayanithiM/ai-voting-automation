// frontend/src/pages/voter/QueueDisplayStubPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useVoterAuth } from '@/store/useVoterAuth';
import API from '@/lib/axios';
import axios, { AxiosError } from 'axios';

interface QueueTokenDetails {
  _id: string;
  tokenNumber: number;
  voterName?: string; // Made optional as per previous usage
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
  token?: QueueTokenDetails; // Is optional if request fails before token creation
  voterFullName?: string; // Backend might send this in the slot response
  // estimatedWaitTime?: string; // This was a placeholder, we will fetch dynamically
}

interface EstimatedWaitTimeResponse {
  success: boolean;
  boothNumber: string;
  waitingCount: number;
  averageProcessingTimeMinutes: number;
  estimatedWaitTimeMinutes: number;
  calculationBasis: string;
  message: string;
}

interface ErrorResponseData {
    message?: string;
    error?: string;
}

export default function QueueDisplayStubPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const votingToken = useVoterAuth((state) => state.votingToken);
  const otpToken = useVoterAuth((state) => state.otpToken); // To check previous step completion
  const clearAuth = useVoterAuth((state) => state.clearAuth);

  const [queueSlotDetails, setQueueSlotDetails] = useState<QueueTokenDetails | null>(null);
  const [voterDisplayName, setVoterDisplayName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [estimatedWaitTimeMessage, setEstimatedWaitTimeMessage] = useState<string>('Calculating wait time...');

  const fetchEstimatedWaitTime = async (boothNum?: string) => {
    try {
      const params: { boothNumber?: string } = {};
      if (boothNum) {
        params.boothNumber = boothNum;
      }
      const waitTimeResponse = await API.get<EstimatedWaitTimeResponse>('/queue/estimate-wait-time', { params });
      if (waitTimeResponse.data.success) {
        setEstimatedWaitTimeMessage(`${waitTimeResponse.data.estimatedWaitTimeMinutes} minutes (approx.)`);
      } else {
        setEstimatedWaitTimeMessage('Could not retrieve wait time.');
      }
    } catch (error) {
      console.error("Error fetching estimated wait time:", error);
      setEstimatedWaitTimeMessage('Error fetching wait time.');
    }
  };

  const requestQueueSlotAndFetchWaitTime = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setQueueSlotDetails(null);
    setEstimatedWaitTimeMessage('Requesting slot and calculating wait time...');

    if (!votingToken) {
      setErrorMessage('Voting session token is invalid or missing. Please start over by verifying your identity.');
      setIsLoading(false);
      // Guide user back more explicitly
      setTimeout(() => {
        clearAuth(); // Clear potentially invalid tokens
        navigate(otpToken ? '/face-verification-stub' : '/voter-id-entry', { replace: true, state: { from: location } });
      }, 3000);
      return;
    }

    try {
      // Step 1: Request the queue slot
      // Pass a boothNumber if your application logic assigns one here, or let backend default
      const slotResponse = await API.post<QueueSlotResponse>('/queue/request-slot', {
        // boothNumber: "SomeBoothIfKnown", // Example: if frontend knows target booth
      });

      if (slotResponse.data.success && slotResponse.data.token) {
        const { message, token, voterFullName } = slotResponse.data;
        setSuccessMessage(message || 'Successfully joined the voting queue!');
        setQueueSlotDetails(token);
        setVoterDisplayName(voterFullName || token.voterName || 'Voter');
        
        // Step 2: Fetch estimated wait time using the boothNumber from the obtained token
        if (token.boothNumber) {
          await fetchEstimatedWaitTime(token.boothNumber);
        } else {
          await fetchEstimatedWaitTime(); // Fetch general wait time if no booth on token
        }
      } else {
        // Handle cases where slot request might not return a token (e.g., already in queue)
        if (slotResponse.data.message && slotResponse.data.message.includes('already in the queue') && slotResponse.data.token) {
            setSuccessMessage(slotResponse.data.message);
            setQueueSlotDetails(slotResponse.data.token);
            setVoterDisplayName(slotResponse.data.voterFullName || slotResponse.data.token.voterName || 'Voter');
            if (slotResponse.data.token.boothNumber) {
                await fetchEstimatedWaitTime(slotResponse.data.token.boothNumber);
            } else {
                await fetchEstimatedWaitTime();
            }
        } else {
            setErrorMessage(slotResponse.data?.message || 'Failed to join queue or received incomplete data from slot request.');
            setEstimatedWaitTimeMessage('Could not calculate wait time.');
        }
      }
    } catch (error: unknown) {
      console.error('Error in requestQueueSlotAndFetchWaitTime:', error);
      let apiErrorMessage = 'An unknown error occurred while requesting slot or fetching wait time.';

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponseData>;
        const errorData = axiosError.response?.data;
        apiErrorMessage = errorData?.message || errorData?.error || axiosError.message || 'A server error occurred.';
        
        if (axiosError.response) {
          if (axiosError.response.status === 403) {
            if (apiErrorMessage.toLowerCase().includes('voted')) {
              setErrorMessage('This voter has already cast their vote. Redirecting...');
              setTimeout(() => navigate('/confirmation-stub', { replace: true }), 2500);
              return; // Exit after navigation for already voted
            } else if (apiErrorMessage.toLowerCase().includes('not approved')) {
               setErrorMessage('Your registration is not approved. Cannot join queue.');
            } else {
                setErrorMessage(`Session error: ${apiErrorMessage}. Please start over.`);
            }
            setTimeout(() => { clearAuth(); navigate('/voter-id-entry', { replace: true }); }, 3000);
            return; // Exit for other 403 errors
          }
          if (axiosError.response.status === 401) {
            setErrorMessage('Your session is invalid or has expired. Please start over.');
            setTimeout(() => { clearAuth(); navigate('/voter-id-entry', { replace: true }); }, 3000);
            return; // Exit for 401
          }
        } else if (axiosError.request) {
          apiErrorMessage = 'No response from server. Please check your connection.';
        }
      } else if (error instanceof Error) {
        apiErrorMessage = error.message;
      }
      setErrorMessage(apiErrorMessage);
      setEstimatedWaitTimeMessage('Could not calculate wait time.');
    } finally {
      setIsLoading(false);
    }
  }, [votingToken, navigate, clearAuth, location, otpToken]); // Added otpToken and location to dependency array

  useEffect(() => {
    // Initial check for votingToken, then request slot and wait time
    if (!votingToken) {
      // This message is more of a fallback, primary check is in useCallback
      alert('Voting session token is missing. Please complete face verification first.');
      const redirectPath = otpToken ? '/face-verification-stub' : '/voter-id-entry';
      navigate(redirectPath, { state: { from: location }, replace: true });
      setIsLoading(false); // Stop loading if redirecting
      return;
    }
    requestQueueSlotAndFetchWaitTime();
  }, [votingToken, otpToken, requestQueueSlotAndFetchWaitTime, navigate, location]); // Added requestQueueSlotAndFetchWaitTime here

  const handleProceedToVote = () => {
    if (queueSlotDetails && successMessage && !isLoading && !errorMessage) {
      navigate('/voting-page-stub');
    } else if (!isLoading) {
      alert("Cannot proceed: Queue joining was not successful, is still in progress, or encountered an error. Please retry.");
    }
  };

  const handleRetry = () => {
      if (votingToken) {
          requestQueueSlotAndFetchWaitTime(); // Retry the whole process
      } else {
          alert("Your session seems to have expired. Please start the process again.");
          clearAuth();
          navigate('/voter-id-entry', {replace: true});
      }
  };

  if (isLoading && !queueSlotDetails) { // Show main loading only if no slot details yet
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
        <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-semibold text-sky-700">Joining voting queue & fetching wait time...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-100 via-teal-50 to-emerald-100 px-4 py-12 text-center">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8 md:p-10 space-y-6 border border-slate-200">
        <h1 className="text-3xl font-bold text-slate-800">Your Queue Status</h1>

        {errorMessage && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md my-4 shadow">
            <p className="font-bold text-lg">Request Error</p>
            <p className="text-sm">{errorMessage}</p>
            <div className="mt-4 space-y-2">
                <Button onClick={handleRetry} className="w-full py-2.5 text-sm bg-amber-500 hover:bg-amber-600 text-white">
                    Retry Request
                </Button>
                <Button onClick={() => { clearAuth(); navigate('/voter-id-entry', {replace: true}); }} className="w-full py-2.5 text-sm bg-slate-600 hover:bg-slate-700 text-white">
                    Return to Start
                </Button>
            </div>
          </div>
        )}

        {successMessage && !errorMessage && queueSlotDetails && (
          <>
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md my-4 shadow-sm">
              <p className="font-bold text-lg">Successfully in Queue!</p>
              <p className="text-sm">{successMessage}</p>
              {voterDisplayName && <p className="mt-2 text-xs text-slate-600">Voter: {voterDisplayName}</p>}
              {queueSlotDetails.boothNumber && <p className="text-xs text-slate-600">Booth: {queueSlotDetails.boothNumber}</p>}
            </div>

            <div className="space-y-3 p-5 border border-slate-200 rounded-lg bg-slate-50 shadow-sm">
              <p className="text-lg text-slate-700">
                Your Queue Number: 
                <span className="font-semibold text-sky-600 text-2xl ml-2">
                  #{queueSlotDetails.tokenNumber || 'N/A'}
                </span>
              </p>
              <p className="text-md text-slate-600">
                Estimated Wait Time: 
                <span className="font-semibold text-sky-700 ml-1">
                  {isLoading && estimatedWaitTimeMessage === 'Calculating wait time...' ? (
                     <span className="animate-pulse">Calculating...</span>
                  ) : (
                    estimatedWaitTimeMessage
                  )}
                </span>
              </p>
            </div>

            <Button 
              onClick={handleProceedToVote} 
              className="w-full py-3 text-lg bg-sky-600 hover:bg-sky-700 text-white mt-5"
              disabled={isLoading || estimatedWaitTimeMessage.includes('Calculating')}
            >
              Proceed to Voting Booth
            </Button>
          </>
        )}
        
        {!isLoading && !errorMessage && !successMessage && ( // Fallback if no state is clearly set
             <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md my-4 shadow">
                 <p className="font-bold">Status Update</p>
                 <p className="text-sm">Could not retrieve full queue status. You may need to retry or start over.</p>
                 <div className="mt-4 space-y-2">
                    <Button onClick={handleRetry} className="w-full py-2.5 text-sm bg-amber-500 hover:bg-amber-600 text-white">
                        Retry
                    </Button>
                    <Button onClick={() => { clearAuth(); navigate('/voter-id-entry', {replace: true}); }} className="mt-2 w-full py-2.5 text-sm bg-slate-600 hover:bg-slate-700 text-white">
                        Return to Start
                    </Button>
                </div>
            </div>
        )}
      </div>
      <footer className="mt-10 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Secure eVoting System. All rights reserved.</p>
      </footer>
    </div>
  );
}