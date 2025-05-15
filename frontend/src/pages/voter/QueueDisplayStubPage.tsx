// src/pages/voter/QueueDisplayStubPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useVoterAuth } from '@/store/useVoterAuth';

export default function QueueDisplayStubPage() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const votingToken = useVoterAuth((state) => state.votingToken);
  const otpToken = useVoterAuth((state) => state.otpToken);
  const [voterInfo, setVoterInfo] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    setIsCheckingSession(true);
    if (!votingToken) {
      alert('Voting session token not found. Please complete face verification.');
      const redirectPath = otpToken ? '/face-verification-stub' : '/voter-id-entry';
      console.log(`QueueDisplayStubPage: No votingToken. OTP token ${otpToken ? 'exists' : 'missing'}. Redirecting to ${redirectPath}`);
      navigate(redirectPath, { state: { from: location }, replace: true });
      return;
    }
    setVoterInfo("Voter ID: STUB_VOTER_XYZ (Verified for Queue)");
    setIsCheckingSession(false);
  }, [votingToken, otpToken, navigate, location]);

  const handleProceedToVote = () => {
    navigate('/voting-page-stub');
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-xl font-semibold">Verifying voting session...</p>
      </div>
    );
  }

  if (!votingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        Invalid session. Redirecting...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-100 via-teal-50 to-emerald-100 px-4 py-12 text-center">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8 md:p-10 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Queue Status</h1>

        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md my-4">
          <p className="font-bold">Successfully Verified!</p>
          <p>You have been added to the voting queue.</p>
          {voterInfo && <p className="mt-2 text-sm">{voterInfo}</p>}
        </div>

        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            Your current position is: <span className="font-semibold text-blue-600">#STUB-001</span>
          </p>
          <p className="text-md text-gray-600">
            Estimated wait time: <span className="font-semibold">Approx. 2 minutes (Stub)</span>
          </p>
        </div>

        <Button onClick={handleProceedToVote} className="w-full py-3 text-base bg-blue-600 hover:bg-blue-700">
          Proceed to Voting Booth (Stub)
        </Button>
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Secure eVoting System. All rights reserved.</p>
      </footer>
    </div>
  );
}
