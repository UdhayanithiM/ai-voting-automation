// src/pages/voter/FaceVerificationStubPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { Button } from '@/components/ui/Button';
import API from '@/lib/axios';
import { useVoterAuth } from '@/store/useVoterAuth';

interface ErrorResponseData {
  error?: string;
  message?: string;
}

interface FaceVerificationStubSuccessData {
  success: boolean;
  message: string;
  token?: string; // ✅ updated to match backend
}

export default function FaceVerificationStubPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>('Preparing for face verification...');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const otpTokenFromStore = useVoterAuth((state) => state.otpToken);
  const setVotingTokenInStore = useVoterAuth((state) => state.setVotingToken);
  // const setOtpTokenInStore = useVoterAuth((state) => state.setOtpToken);

  const handleVerifyFace = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage('Attempting face verification (stubbed)...');

    if (!otpTokenFromStore) {
      setError('OTP Session token not found. Please verify OTP again.');
      setIsLoading(false);
      setTimeout(() => navigate('/verify-otp'), 3000);
      return;
    }

    try {
      const response = await API.post<FaceVerificationStubSuccessData>(
        '/verification/face-stub',
        {},
        {
          headers: {
            Authorization: `Bearer ${otpTokenFromStore}`,
          },
        }
      );

      if (response.data && response.data.success) {
        const newVotingToken = response.data.token; // ✅ corrected key

        if (newVotingToken) {
          setVotingTokenInStore(newVotingToken);
          // setOtpTokenInStore(null);
          setStatusMessage(response.data.message || 'Face verification successful. Proceeding...');
          setTimeout(() => {
            navigate('/queue-display-stub');
          }, 2000);
        } else {
          setError('Verification successful, but session update failed (voting token missing). Please try again.');
          setStatusMessage('');
        }
      } else {
        setError(response.data?.message || 'Face verification failed (stubbed).');
        setStatusMessage('');
      }
    } catch (err: unknown) {
      console.error('Face Verification Stub error:', err);
      setStatusMessage('');
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ErrorResponseData>;
        if (axiosError.response?.data) {
          setError(axiosError.response.data.error || axiosError.response.data.message || 'Face verification stub call failed.');
        } else if (axiosError.request) {
          setError('No response from server. Please check connection.');
        } else {
          setError('Error setting up request for face verification.');
        }
      } else if (err instanceof Error) {
        setError(`An unexpected error occurred: ${err.message}`);
      } else {
        setError('An unknown error occurred during face verification.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [otpTokenFromStore, navigate, setVotingTokenInStore]);

  useEffect(() => {
    handleVerifyFace();
  }, [handleVerifyFace]);

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
            <Button onClick={() => navigate('/voter-id-entry')} className="mt-4 bg-red-500 hover:bg-red-600">
              Try Again from Start
            </Button>
          </div>
        )}

        {!isLoading && !error && statusMessage.includes('successful') && (
          <div className="text-green-600 font-semibold text-lg py-4">
            <p>✅ {statusMessage}</p>
          </div>
        )}
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Secure eVoting System. All rights reserved.</p>
      </footer>
    </div>
  );
}
