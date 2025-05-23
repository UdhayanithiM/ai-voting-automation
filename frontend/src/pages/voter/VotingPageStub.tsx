// src/pages/voter/VotingPageStub.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useVoterAuth } from '@/store/useVoterAuth';

interface Candidate {
  id: string;
  name: string;
  party?: string;
  symbol?: string;
}

const MOCK_CANDIDATES: Candidate[] = [
  { id: 'candidate-1', name: 'Candidate Alpha', party: 'Party A', symbol: '🌟' },
  { id: 'candidate-2', name: 'Candidate Beta', party: 'Party B', symbol: '🚀' },
  { id: 'candidate-3', name: 'Candidate Gamma', party: 'Party C', symbol: '💡' },
  { id: 'candidate-4', name: 'NOTA', party: 'None of the Above', symbol: '❌' },
];

export default function VotingPageStub() {
  const navigate = useNavigate();
  const votingToken = useVoterAuth((state) => state.votingToken);
  const otpToken = useVoterAuth((state) => state.otpToken); // For redirect logic in useEffect
  const clearAuth = useVoterAuth((state) => state.clearAuth); // Store action

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialCheckDone, setIsInitialCheckDone] = useState(false);

  useEffect(() => {
    // This effect handles redirection if the page is loaded without a votingToken.
    if (!votingToken) {
      if (isInitialCheckDone) { // Only redirect after initial check to allow store rehydration
        alert('Voting session is invalid or has expired. Please complete previous steps.');
        const redirectPath = otpToken ? '/face-verification-stub' : '/voter-id-entry';
        console.log(`VotingPageStub: No votingToken. OTP token ${otpToken ? 'exists' : 'missing'}. Redirecting to ${redirectPath}`);
        navigate(redirectPath, { replace: true });
      }
    }
    setIsInitialCheckDone(true);
  }, [votingToken, otpToken, navigate, isInitialCheckDone]);

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
      setIsLoading(false);
      setTimeout(() => navigate('/voter-id-entry', { replace: true }), 1500); // Allow time to see error
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusMessage('Casting your vote (stubbed)...');

    // Simulate API call delay
    setTimeout(() => {
      setStatusMessage('Your vote has been successfully recorded! Redirecting...');
      setIsLoading(false); // Show success message on this page

      // Navigate AFTER a brief moment to allow the user to see the success message.
      setTimeout(() => {
        navigate('/confirmation-stub');
        // Call clearAuth. The delay for clearing tokens is now INSIDE the store's clearAuth action.
        clearAuth();
      }, 1000); // 1-second delay for UX, then navigate & trigger clearAuth. Adjust as needed.

    }, 1500); // This outer timeout simulates the API call duration
  }, [selectedCandidateId, navigate, clearAuth, votingToken]);

  if (!isInitialCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-xl font-semibold">Initializing voting page...</p>
      </div>
    );
  }

  // This check should ideally be redundant if ProtectedVoterAuthRoute works correctly.
  // It's a fallback.
  if (!votingToken && !isLoading) { 
    console.error("VotingPageStub: Rendered without votingToken after initial check and not loading.");
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-red-500 font-semibold">Critical session error. Please <a href="/voter-id-entry">start over</a>.</p>
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center space-y-3 py-4">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg text-green-600 font-semibold">{statusMessage || 'Processing...'}</p>
          </div>
        )}

        {/* Error Message */}
        {!isLoading && error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md my-4" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Success Message (before navigating) */}
        {!isLoading && !error && statusMessage && statusMessage.includes('successfully recorded') && (
           <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md my-4">
            <p className="font-bold">Success!</p>
            <p>{statusMessage}</p>
           </div>
        )}

        {/* Voting Form - only show if not loading AND vote hasn't been (successfully) recorded yet on THIS page view */}
        {!isLoading && !(statusMessage && statusMessage.includes('successfully recorded')) && (
          <form onSubmit={(e) => { e.preventDefault(); handleCastVote(); }} className="space-y-6">
            <fieldset className="space-y-4">
              <legend className="sr-only">Candidates</legend>
              {MOCK_CANDIDATES.map((candidate) => (
                <label
                  key={candidate.id}
                  htmlFor={candidate.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-150 ease-in-out
                    ${selectedCandidateId === candidate.id
                    ? 'bg-blue-500 border-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-300'}`}
                >
                  <input
                    type="radio"
                    id={candidate.id}
                    name="candidateSelection"
                    value={candidate.id}
                    checked={selectedCandidateId === candidate.id}
                    onChange={() => handleSelectCandidate(candidate.id)}
                    className="sr-only"
                  />
                  {candidate.symbol && <span className="text-2xl mr-3">{candidate.symbol}</span>}
                  <span className="font-medium">{candidate.name}</span>
                  {candidate.party && <span className="ml-auto text-sm opacity-75">{candidate.party}</span>}
                </label>
              ))}
            </fieldset>
            <Button
              type="submit"
              className="w-full py-3 text-lg bg-green-600 hover:bg-green-700 disabled:opacity-50"
              disabled={!selectedCandidateId || isLoading || !votingToken}
            >
              {isLoading ? 'Casting Vote...' : 'Cast My Vote'}
            </Button>
          </form>
        )}
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Secure eVoting System. All rights reserved.</p>
      </footer>
    </div>
  );
}