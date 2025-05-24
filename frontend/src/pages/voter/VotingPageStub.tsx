// src/pages/voter/VotingPageStub.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useVoterAuth } from '@/store/useVoterAuth';
import API from '@/lib/axios'; // Your Axios instance

// Interface for Candidate data from the API
interface Candidate {
  _id: string; // Assuming MongoDB ObjectId, adjust if different
  name: string;
  party?: string;
  symbolUrl?: string; // If you have URLs for symbols
  symbol?: string; // Fallback or alternative text symbol
  voteCount?: number; // Optional, if backend sends it
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
  vote?: { // Optional: details of the cast vote if returned
    _id: string;
    voter: string;
    candidate: string;
    timestamp: string;
  };
}

export default function VotingPageStub() {
  const navigate = useNavigate();
  const location = useLocation(); // For redirect state
  const votingToken = useVoterAuth((state) => state.votingToken);
  const otpToken = useVoterAuth((state) => state.otpToken);
  const clearAuth = useVoterAuth((state) => state.clearAuth);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
  const [isCastingVote, setIsCastingVote] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialTokenCheckDone, setIsInitialTokenCheckDone] = useState(false);

  // Effect for initial token check and redirection
  useEffect(() => {
    if (!votingToken) {
      if (isInitialTokenCheckDone) {
        alert('Voting session is invalid or has expired. Please complete previous steps.');
        const redirectPath = otpToken ? '/queue-display-stub' : (votingToken ? '/face-verification-stub' : '/voter-id-entry');
        console.log(`VotingPageStub: No votingToken. OTP token ${otpToken ? 'exists' : 'missing'}. Redirecting to ${redirectPath}`);
        navigate(redirectPath, { replace: true, state: { from: location } });
      }
    }
    setIsInitialTokenCheckDone(true);
  }, [votingToken, otpToken, navigate, isInitialTokenCheckDone, location]);


  // Effect to fetch candidates
  useEffect(() => {
    if (!votingToken) {
        // Don't fetch if votingToken isn't ready or valid (handled by the above useEffect)
        if(isInitialTokenCheckDone) setIsLoadingCandidates(false); // Stop loading if token check failed
        return;
    }

    const fetchCandidates = async () => {
      setIsLoadingCandidates(true);
      setError(null);
      try {
        // The votingToken will be sent by the Axios interceptor
        const response = await API.get<CandidatesResponse>('/candidates');
        if (response.data && response.data.success) {
          setCandidates(response.data.candidates);
        } else {
          setError(response.data?.message || 'Failed to load candidates.');
          setCandidates([]); // Clear any stale candidates
        }
      } catch (err: any) {
        console.error('Error fetching candidates:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
            alert('Your session is invalid. Please log in again.');
            clearAuth();
            navigate('/voter-id-entry', { replace: true });
        } else {
            setError(err.response?.data?.message || 'An error occurred while fetching candidates.');
        }
        setCandidates([]);
      } finally {
        setIsLoadingCandidates(false);
      }
    };

    fetchCandidates();
  }, [votingToken, clearAuth, navigate, isInitialTokenCheckDone]); // Depend on votingToken and isInitialTokenCheckDone

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setError(null); // Clear error when a new selection is made
  };

  const handleCastVote = useCallback(async () => {
    if (!selectedCandidateId) {
      setError('Please select a candidate before casting your vote.');
      return;
    }
    if (!votingToken) {
      setError('Your voting session is no longer valid. Please start over.');
      setIsCastingVote(false);
      // Redirect after a short delay for user to see message
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
      // The votingToken will be sent by the Axios interceptor
      const response = await API.post<CastVoteResponse>('/vote', {
        candidateId: selectedCandidateId,
      });

      if (response.data && response.data.success) {
        setStatusMessage(response.data.message || 'Your vote has been successfully recorded! Redirecting...');
        setTimeout(() => {
          navigate('/confirmation-stub');
          clearAuth(); // Clear auth state after successful vote and navigation
        }, 1500); // Delay for UX to see success message
      } else {
        setError(response.data?.message || 'Failed to cast vote. Please try again.');
        setStatusMessage(null);
      }
    } catch (err: any) {
      console.error('Error casting vote:', err);
       if (err.response?.status === 401 || err.response?.status === 403) {
            alert(err.response?.data?.message || 'Your session is invalid or you might have already voted. Redirecting.');
            clearAuth();
            navigate('/voter-id-entry', { replace: true }); // Or to a specific "already voted" page
        } else {
            setError(err.response?.data?.message || 'An error occurred while casting your vote.');
        }
      setStatusMessage(null);
    } finally {
      // Only set isCastingVote to false if there was an error and we are not redirecting
      // If successful, navigation will occur, and this component will unmount.
      if (error || (statusMessage && !statusMessage.includes('successfully recorded'))) {
          setIsCastingVote(false);
      }
    }
  }, [selectedCandidateId, votingToken, navigate, clearAuth, error, statusMessage]); // Added error & statusMessage dependencies

  if (!isInitialTokenCheckDone || isLoadingCandidates) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-xl font-semibold">
          {isLoadingCandidates ? 'Loading candidates...' : 'Initializing voting page...'}
        </p>
      </div>
    );
  }

  if (!votingToken && !isCastingVote) {
    // This state should ideally be caught by the initial useEffect redirect.
    // If it gets here, it's a fallback.
    console.error("VotingPageStub: Rendered without votingToken after checks and not casting vote.");
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-red-500 font-semibold">
          Critical session error. Please <a href="/voter-id-entry" className="underline">start over</a>.
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
            <div className={`w-16 h-16 border-4 ${error ? 'border-red-500' : 'border-green-500'} border-t-transparent rounded-full animate-spin`}></div>
            <p className={`text-lg font-semibold ${error ? 'text-red-600' : 'text-green-600'}`}>
              {statusMessage || 'Processing...'}
            </p>
          </div>
        )}

        {!isCastingVote && error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md my-4" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {/* Only show candidates and vote button if NOT casting vote AND vote has NOT been successfully recorded on this page view */}
        {!isCastingVote && !(statusMessage && statusMessage.includes('successfully recorded')) && (
          <form onSubmit={(e) => { e.preventDefault(); handleCastVote(); }} className="space-y-6">
            {candidates.length === 0 && !isLoadingCandidates && !error && (
                 <p className="text-center text-gray-500">No candidates available at the moment.</p>
            )}
            {candidates.length > 0 && (
                 <fieldset className="space-y-4">
                 <legend className="sr-only">Candidates</legend>
                 {candidates.map((candidate) => (
                   <label
                     key={candidate._id} // Use _id from API
                     htmlFor={candidate._id}
                     className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-150 ease-in-out
                       ${selectedCandidateId === candidate._id
                         ? 'bg-blue-500 border-blue-600 text-white shadow-lg scale-105'
                         : 'bg-gray-50 hover:bg-gray-100 border-gray-300'}`}
                   >
                     <input
                       type="radio"
                       id={candidate._id}
                       name="candidateSelection"
                       value={candidate._id}
                       checked={selectedCandidateId === candidate._id}
                       onChange={() => handleSelectCandidate(candidate._id)}
                       className="sr-only"
                     />
                     {candidate.symbolUrl ? (
                        <img src={candidate.symbolUrl} alt={`${candidate.name} symbol`} className="w-8 h-8 mr-3 object-contain" />
                     ) : candidate.symbol && (
                        <span className="text-2xl mr-3">{candidate.symbol}</span>
                     )}
                     <span className="font-medium">{candidate.name}</span>
                     {candidate.party && <span className="ml-auto text-sm opacity-75">{candidate.party}</span>}
                   </label>
                 ))}
               </fieldset>
            )}
           
            {candidates.length > 0 && (
                 <Button
                 type="submit"
                 className="w-full py-3 text-lg bg-green-600 hover:bg-green-700 disabled:opacity-50"
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