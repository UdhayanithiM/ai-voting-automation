// src/pages/voter/FaceVerificationStubPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import API from '@/lib/axios'; // Your configured API instance
import { useVoterAuth } from '@/store/useVoterAuth';
import axios, { AxiosError } from 'axios'; // <<<< IMPORT axios and AxiosError

// Match backend ErrorResponse structure
interface ErrorResponseData {
  message?: string;
  error?: string;
}

// Match backend success response for /verification/face-stub
interface FaceVerificationStubSuccessData {
  success: boolean;
  message: string;
  token?: string; // This is the new votingToken
  voter?: {
    id: string;
    fullName?: string; 
  };
}

export default function FaceVerificationStubPage() {
  const [isLoading, setIsLoading] = useState(false); 
  const [statusMessage, setStatusMessage] = useState<string>('Preparing for face verification...');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const otpToken = useVoterAuth((state) => state.otpToken);
  const setVotingToken = useVoterAuth((state) => state.setVotingToken);
  const clearAuth = useVoterAuth((state) => state.clearAuth); 
  const currentVotingToken = useVoterAuth(state => state.votingToken);

  const handleAttemptFaceVerification = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage('Attempting face verification (stubbed)...');

    if (!otpToken) {
      setStatusMessage('');
      setError('OTP Session token not found. Please verify OTP again.');
      setIsLoading(false);
      setTimeout(() => {
        navigate('/verify-otp', { replace: true, state: { from: location } });
      }, 2000);
      return;
    }

    try {
      const response = await API.post<FaceVerificationStubSuccessData>(
        '/verification/face-stub',
        {}
      );

      if (response.data && response.data.success && response.data.token) {
        const newVotingToken = response.data.token;
        setStatusMessage(response.data.message || 'Face verification successful. Proceeding...');
        setVotingToken(newVotingToken);
        setTimeout(() => {
          navigate('/queue-display-stub');
        }, 1500);
      } else {
        const errMsg = response.data?.message || 'Verification did not return a valid session token. Please try again.';
        setError(errMsg);
        setStatusMessage('');
        setIsLoading(false);
        setTimeout(() => {
          clearAuth(); 
          navigate('/voter-id-entry', { replace: true });
        }, 3000);
      }
    } catch (err: unknown) { // <<<< CHANGED from 'any' to 'unknown' (Fix for ESLint error at line 84)
      console.error('Face Verification Stub API error:', err);
      setStatusMessage('');
      let specificErrorMessage = 'An unknown error occurred during face verification.';

      if (axios.isAxiosError(err)) { // <<<< CHANGED from API.isAxiosError to axios.isAxiosError (Fix for TypeScript error at line 88)
        const axiosError = err as AxiosError<ErrorResponseData>; // AxiosError is imported now
        if (axiosError.response?.data) {
          specificErrorMessage =
            axiosError.response.data.message ||
            axiosError.response.data.error ||
            'Face verification failed.';
        } else if (axiosError.request) {
          specificErrorMessage = 'No response from the server. Please check your network connection.';
        }
        
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          alert(specificErrorMessage + " Your OTP session may have expired. Please start over.");
          clearAuth(); 
          navigate('/voter-id-entry', { replace: true });
          return; 
        }
      } else if (err instanceof Error) {
        specificErrorMessage = err.message;
      }
      setError(specificErrorMessage);
      setIsLoading(false);
    }
  }, [otpToken, navigate, setVotingToken, location, clearAuth]);

  useEffect(() => {
    if (currentVotingToken) {
      console.log("FaceVerificationStubPage: votingToken already exists. Redirecting to /queue-display-stub");
      navigate('/queue-display-stub', { replace: true });
      return;
    }

    if (!otpToken) {
      console.warn("FaceVerificationStubPage: otpToken not found on mount, redirecting to /verify-otp");
      alert("OTP session not found. Please complete OTP verification first.");
      setIsLoading(false); 
      navigate('/verify-otp', { replace: true, state: { from: location } });
      return;
    }
    
    setStatusMessage('Initializing face verification...');
    setIsLoading(true); 
    const timer = setTimeout(() => {
        handleAttemptFaceVerification();
    }, 500); 

    return () => clearTimeout(timer); 
  }, [otpToken, currentVotingToken, handleAttemptFaceVerification, navigate, location]);


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-red-100 px-4 py-12 text-center">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8 md:p-10 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Face Verification</h1>
        
        {isLoading && (
          <div className="flex flex-col items-center space-y-3 py-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg text-blue-600 font-semibold">{statusMessage || 'Processing...'}</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md my-4" role="alert">
            <p className="font-bold">Verification Error</p>
            <p>{error}</p>
            <Button 
              onClick={() => { clearAuth(); navigate('/voter-id-entry', {replace: true}); }} 
              className="mt-4 bg-red-500 hover:bg-red-600 text-white w-full"
            >
              Return to Start
            </Button>
          </div>
        )}

        {!isLoading && !error && statusMessage && statusMessage.includes('successful') && (
          <div className="text-green-600 font-semibold text-lg py-4">
            <p>✅ {statusMessage}</p>
            <p>Redirecting shortly...</p>
          </div>
        )}
        
        {!isLoading && !error && !(statusMessage && statusMessage.includes('successful')) && !otpToken && (
             <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md my-4">
                <p className="font-bold">Session Issue</p>
                <p>Your session is invalid. Please start the process again.</p>
                <Button onClick={() => { clearAuth(); navigate('/voter-id-entry', {replace: true}); }} className="mt-4 w-full">
                    Go to Start
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