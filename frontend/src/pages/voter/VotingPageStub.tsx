// src/pages/voter/VotingPageStub.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useVoterAuth } from '@/store/useVoterAuth';
import API from '@/lib/axios'; // Your Axios instance
import axios, { AxiosError } from 'axios'; // <<<< IMPORT axios and AxiosError

// Interface for Candidate data from the API
interface Candidate {
  _id: string;
  name: string;
  party?: string;
  symbolUrl?: string;
  symbol?: string;
  voteCount?: number;
}

// Interface for the API response when fetching candidates
interface CandidatesResponse {
  success: boolean;
  candidates: Candidate[];
  message?: string;
}

// Interface for the API response when casting a vote
interface CastVoteResponse {
  success: boolean;
  message: string;
  vote?: {
    _id: string;
    voter: string;
    candidate: string;
    timestamp: string;
  };
}

// Define a more specific type for Axios errors if your backend sends a standard error structure
interface ApiErrorData {
    message?: string;
    error?: string; // if backend might use this key
}

export default function VotingPageStub() {
  const navigate = useNavigate();
  const location = useLocation();
  const votingToken = useVoterAuth((state) => state.votingToken);
  const otpToken = useVoterAuth((state) => state.otpToken); // Keep for redirect logic
  const clearAuth = useVoterAuth((state) => state.clearAuth);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
  const [isCastingVote, setIsCastingVote] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialTokenCheckDone, setIsInitialTokenCheckDone] = useState(false);

  useEffect(() => {
    if (!votingToken) {
      if (isInitialTokenCheckDone) {
        alert('Voting session is invalid or has expired. Please complete previous steps.');
        // Determine redirect path based on available tokens
        const redirectPath = otpToken ? '/queue-display-stub' : '/voter-id-entry'; 
        // Note: The original logic included: (votingToken ? '/face-verification-stub' : '/voter-id-entry')
        // but if !votingToken is true, that part of the ternary is unreachable for '/face-verification-stub'.
        // It implies if otpToken exists, they might have missed queue display.
        // If no tokens, back to start.
        console.log(`VotingPageStub: No votingToken. OTP token ${otpToken ? 'exists' : 'missing'}. Redirecting to ${redirectPath}`);
        navigate(redirectPath, { replace: true, state: { from: location } });
      }
    }
    setIsInitialTokenCheckDone(true);
  }, [votingToken, otpToken, navigate, isInitialTokenCheckDone, location]);

  useEffect(() => {
    if (!votingToken || !isInitialTokenCheckDone) {
      if (isInitialTokenCheckDone && !votingToken) { // Only stop loading if token check is done and it failed
          setIsLoadingCandidates(false);
      }
      return;
    }

    const fetchCandidatesList = async () => {
      setIsLoadingCandidates(true);
      setError(null);
      try {
        const response = await API.get<CandidatesResponse>('/candidates');
        if (response.data && response.data.success) {
          setCandidates(response.data.candidates);
        } else {
          setError(response.data?.message || 'Failed to load candidates.');
          setCandidates([]);
        }
      } catch (err: unknown) { // <<<< CHANGED from 'any' to 'unknown'
        console.error('Error fetching candidates:', err);
        let specificErrorMessage = 'An error occurred while fetching candidates.';
        if (axios.isAxiosError(err)) {
            const axiosError = err as AxiosError<ApiErrorData>;
            specificErrorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || specificErrorMessage;
            if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
                alert('Your session is invalid or you are not authorized to view candidates. Please log in again.');
                clearAuth();
                navigate('/voter-id-entry', { replace: true });
                return; // Stop further processing in this function
            }
        } else if (err instanceof Error) {
            specificErrorMessage = err.message;
        }
        setError(specificErrorMessage);
        setCandidates([]);
      } finally {
        setIsLoadingCandidates(false);
      }
    };

    fetchCandidatesList();
  }, [votingToken, clearAuth, navigate, isInitialTokenCheckDone]); // isInitialTokenCheckDone ensures the first effect runs

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setError(null); 
  };

  const handleCastVote = useCallback(async () => {
    if (!selectedCandidateId) {
      setError('Please select a candidate before casting your vote.');
      return;
    }
    if (!votingToken) {
      setError('Your voting session is no longer valid. Please start over.');
      setIsCastingVote(false);
      setTimeout(() => {
        clearAuth();
        navigate('/voter-id-entry', { replace: true });
      }, 2000);
      return;
    }

    setIsCastingVote(true);
    setError(null);
    setStatusMessage('Casting your vote...');

    try {
      const response = await API.post<CastVoteResponse>('/vote', {
        candidateId: selectedCandidateId,
      });

      if (response.data && response.data.success) {
        setStatusMessage(response.data.message || 'Your vote has been successfully recorded! Redirecting...');
        setTimeout(() => {
          navigate('/confirmation-stub');
          clearAuth(); 
        }, 1500);
      } else {
        setError(response.data?.message || 'Failed to cast vote. Please try again.');
        setStatusMessage(null);
        setIsCastingVote(false); // Allow retry if vote cast failed but didn't throw
      }
    } catch (err: unknown) { // <<<< CHANGED from 'any' to 'unknown'
      console.error('Error casting vote:', err);
      let specificErrorMessage = 'An error occurred while casting your vote.';
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorData>;
        specificErrorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || specificErrorMessage;
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          alert(specificErrorMessage); // Message from backend (e.g. "Already voted", "Invalid session")
          clearAuth();
          navigate('/voter-id-entry', { replace: true }); 
          return; 
        }
      } else if (err instanceof Error) {
        specificErrorMessage = err.message;
      }
      setError(specificErrorMessage);
      setStatusMessage(null);
      setIsCastingVote(false); // Ensure button is re-enabled on error
    }
    // Removed finally block for setIsCastingVote, handled in error/success paths
  }, [selectedCandidateId, votingToken, navigate, clearAuth]); // Removed error & statusMessage from dependencies

  if (!isInitialTokenCheckDone || isLoadingCandidates) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-xl font-semibold">
          {isLoadingCandidates ? 'Loading candidates...' : 'Initializing voting page...'}
        </p>
      </div>
    );
  }

  // This check is slightly redundant due to the first useEffect but acts as a final safeguard.
  if (!votingToken && !isCastingVote) {
    console.error("VotingPageStub: Rendered without votingToken after checks and not casting vote.");
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-red-500 font-semibold">
          Critical session error. Please <a href="/voter-id-entry" className="underline hover:text-red-700">start over</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-cyan-50 to-blue-100 px-4 py-12">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-xl p-8 md:p-10 space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Cast Your Vote</h1>
          <p className="text-gray-600 mt-2">Select your preferred candidate from the list below.</p>
        </header>

        {(isCastingVote || (statusMessage && statusMessage.includes('successfully recorded'))) && (
          <div className="flex flex-col items-center space-y-3 py-4">
            <div className={`w-16 h-16 border-4 ${error && !statusMessage?.includes('successful') ? 'border-red-500' : 'border-green-500'} border-t-transparent rounded-full animate-spin`}></div>
            <p className={`text-lg font-semibold ${error && !statusMessage?.includes('successful') ? 'text-red-600' : 'text-green-600'}`}>
              {statusMessage || (error ? 'Error occurred' : 'Processing...')}
            </p>
          </div>
        )}

        {!isCastingVote && error && !(statusMessage && statusMessage.includes('successfully recorded')) && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md my-4" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {!isCastingVote && !(statusMessage && statusMessage.includes('successfully recorded')) && (
          <form onSubmit={(e) => { e.preventDefault(); handleCastVote(); }} className="space-y-6">
            {candidates.length === 0 && !isLoadingCandidates && !error && (
                <p className="text-center text-gray-500 py-4">No candidates available at the moment or failed to load.</p>
            )}
            {candidates.length > 0 && (
                <fieldset className="space-y-4">
                <legend className="sr-only">Candidates</legend>
                {candidates.map((candidate) => (
                  <label
                    key={candidate._id}
                    htmlFor={candidate._id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-150 ease-in-out
                      ${selectedCandidateId === candidate._id
                        ? 'bg-blue-500 border-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-300 focus-within:ring-2 focus-within:ring-blue-400'}`}
                  >
                    <input
                      type="radio"
                      id={candidate._id}
                      name="candidateSelection"
                      value={candidate._id}
                      checked={selectedCandidateId === candidate._id}
                      onChange={() => handleSelectCandidate(candidate._id)}
                      className="sr-only"
                      aria-label={candidate.name}
                    />
                    {candidate.symbolUrl ? (
                      <img src={candidate.symbolUrl} alt={`${candidate.name} symbol`} className="w-10 h-10 mr-4 object-contain rounded-sm" />
                    ) : candidate.symbol && (
                      <span className="text-3xl mr-4 w-10 h-10 flex items-center justify-center bg-gray-200 rounded-sm">{candidate.symbol}</span>
                    )}
                    <div className="flex-grow">
                        <span className="font-medium text-lg">{candidate.name}</span>
                        {candidate.party && <span className="block text-sm opacity-80">{candidate.party}</span>}
                    </div>
                    {selectedCandidateId === candidate._id && (
                        <span className="ml-auto text-2xl">✓</span>
                    )}
                  </label>
                ))}
              </fieldset>
            )}
            
            {candidates.length > 0 && (
                <Button
                type="submit"
                className="w-full py-3 text-lg bg-green-600 hover:bg-green-700 disabled:opacity-60"
                disabled={!selectedCandidateId || isCastingVote || !votingToken || isLoadingCandidates}
              >
                {isCastingVote ? 'Casting Vote...' : 'Cast My Vote'}
              </Button>
            )}
          </form>
        )}
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Secure eVoting System. All rights reserved.</p>
      </footer>
    </div>
  );
}