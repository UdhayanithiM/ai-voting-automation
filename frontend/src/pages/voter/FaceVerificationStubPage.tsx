// src/pages/voter/FaceVerificationStubPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } // Import useLocation
from 'react-router-dom';
// import axios, { AxiosError } from 'axios'; // API instance handles AxiosError type
import { Button } from '@/components/ui/Button';
import API from '@/lib/axios'; // Use your configured API instance
import { useVoterAuth } from '@/store/useVoterAuth';

// Match backend ErrorResponse structure if it's standard
interface ErrorResponseData {
  message?: string; // Typically, backend sends 'message' for errors
  error?: string; // Or 'error'
}

// Match backend success response for /verification/face-stub
interface FaceVerificationStubSuccessData {
  success: boolean;
  message: string;
  token?: string; // This is the new votingToken
  voter?: { // Optional: if backend sends voter details
    id: string;
    fullName: string;
    phone?: string;
  };
}

export default function FaceVerificationStubPage() {
  const [isLoading, setIsLoading] = useState(true); // Start true to auto-trigger verification
  const [statusMessage, setStatusMessage] = useState<string>('Preparing for face verification...');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation(); // For redirect state

  const otpToken = useVoterAuth((state) => state.otpToken);
  const setVotingToken = useVoterAuth((state) => state.setVotingToken);
  const currentVotingToken = useVoterAuth(state => state.votingToken); // To check if already have voting token

  const handleVerifyFace = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage('Attempting face verification (stubbed)...');

    if (!otpToken) {
      setError('OTP Session token not found. Please verify OTP again.');
      setStatusMessage(''); // Clear loading message
      setIsLoading(false);
      navigate('/verify-otp', { replace: true, state: { from: location } });
      return;
    }

    try {
      // Axios interceptor in API will add the Authorization header with otpToken
      const response = await API.post<FaceVerificationStubSuccessData>(
        '/verification/face-stub',
        {} // Empty body for this stub
      );

      if (response.data && response.data.success) {
        const newVotingToken = response.data.token;

        if (newVotingToken) {
          setStatusMessage(response.data.message || 'Face verification successful. Proceeding...');
          // 1. Set the new votingToken in the store.
          // The store action will handle clearing the otpToken.
          setVotingToken(newVotingToken);

          // 2. Navigate AFTER the store update is likely processed.
          // React's state updates can be batched, navigate in a microtask to be safer.
          setTimeout(() => {
            navigate('/queue-display-stub');
          }, 0);
          // No return here, setIsLoading(false) will be hit in finally if not navigating immediately
        } else {
          setError('Verification successful, but session update failed (voting token missing from response). Please try again.');
          setStatusMessage('');
          setIsLoading(false);
        }
      } else {
        setError(response.data?.message || 'Face verification failed (stubbed).');
        setStatusMessage('');
        setIsLoading(false);
      }
    } catch (err: any) { // Explicitly type err as any or unknown then check type
      console.error('Face Verification Stub error:', err);
      setStatusMessage('');
      let specificErrorMessage = 'An unknown error occurred during face verification.';
      if (API.isAxiosError(err)) { // Use API.isAxiosError if available, or axios.isAxiosError
        const axiosError = err as import('axios').AxiosError<ErrorResponseData>; // Correct type for AxiosError
        if (axiosError.response?.data) {
          specificErrorMessage =
            axiosError.response.data.message || // Prioritize 'message'
            axiosError.response.data.error ||
            'Face verification stub call failed.';
        } else if (axiosError.request) {
          specificErrorMessage = 'No response from server. Please check connection.';
        } else {
          specificErrorMessage = 'Error setting up request for face verification.';
        }
        // Handle specific status codes for redirection
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            alert(specificErrorMessage + " Please try OTP verification again.");
            useVoterAuth.getState().clearAuth(); // Clear all auth tokens
            navigate('/voter-id-entry', {replace: true});
            return; // Exit after navigation
        }
      } else if (err instanceof Error) {
        specificErrorMessage = `An error occurred: ${err.message}`;
      }
      setError(specificErrorMessage);
      setIsLoading(false);
    }
    // setIsLoading(false); // Moved to specific paths to avoid setting it if navigation occurs
  }, [otpToken, navigate, setVotingToken, location]);

  useEffect(() => {
    // If user somehow lands here with a votingToken already, move to next step.
    if (currentVotingToken) {
        navigate('/queue-display-stub', { replace: true });
        return;
    }

    if (otpToken) {
      handleVerifyFace();
    } else {
      // This runs if otpToken is not available when component mounts
      console.warn("FaceVerificationStubPage: otpToken not found on mount, redirecting to /verify-otp");
      alert("OTP session not found. Please complete OTP verification first.");
      navigate('/verify-otp', { replace: true, state: { from: location } });
      setIsLoading(false); // Ensure loading stops if we redirect immediately
    }
  }, [otpToken, handleVerifyFace, navigate, location, currentVotingToken]); // Dependencies for this effect

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-red-100 px-4 py-12 text-center">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8 md:p-10 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Face Verification</h1>
        {isLoading && (
          <div className="flex flex-col items-center space-y-3 py-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg text-blue-600 font-semibold">{statusMessage}</p>
          </div>
        )}
        {!isLoading && error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md my-4" role="alert">
            <p className="font-bold">Verification Error</p>
            <p>{error}</p>
            <Button onClick={() => navigate('/voter-id-entry', {replace: true})} className="mt-4 bg-red-500 hover:bg-red-600">
              Try Again from Start
            </Button>
          </div>
        )}
        {/* Show success message briefly before navigation (navigation is now quick) */}
        {!isLoading && !error && statusMessage && statusMessage.includes('successful') && (
          <div className="text-green-600 font-semibold text-lg py-4">
            <p>✅ {statusMessage}</p>
            <p>Redirecting...</p>
          </div>
        )}
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Secure eVoting System. All rights reserved.</p>
      </footer>
    </div>
  );
}