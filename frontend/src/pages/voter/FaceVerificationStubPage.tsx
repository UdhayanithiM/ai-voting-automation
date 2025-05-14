// src/pages/voter/FaceVerificationStubPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { Button } from '@/components/ui/Button';
import API from '@/lib/axios'; // Your pre-configured Axios instance
import { useVoterAuth } from '@/store/useVoterAuth'; // To get the voter session token

// Interface for the expected error response from the backend
interface ErrorResponseData {
  error?: string;
  message?: string;
}

// Interface for the expected success response from the face verification stub
interface FaceVerificationStubSuccessData {
  success: boolean;
  message: string;
  // Add any other data your stub might return, if any
}

export default function FaceVerificationStubPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Preparing for face verification...');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const voterSessionToken = useVoterAuth((state) => state.token); // Get token from Zustand store

  // This useEffect can simulate an automatic "scan" or you can have a button
  useEffect(() => {
    // Automatically attempt verification when the page loads
    // Or, you can move this logic into a button's onClick handler
    handleVerifyFace();
  }, []); // Empty dependency array means it runs once on mount

  const handleVerifyFace = async () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage('Attempting face verification (stubbed)...');

    if (!voterSessionToken) {
      setError('Authentication token not found. Please log in again.');
      setIsLoading(false);
      // Optionally navigate to login after a delay
      setTimeout(() => navigate('/voter-id-entry'), 3000);
      return;
    }

    try {
      // Endpoint should match your backend's Face Verification STUB API (Task 1.5)
      // This API should be protected by `protectVoterSession` middleware
      const response = await API.post<FaceVerificationStubSuccessData>(
        '/verification/face-stub', // Or your actual endpoint, e.g., /voter/face-verify-stub
        {}, // Empty body for a stub, or send placeholder data if your backend expects it
        {
          headers: {
            // Explicitly set Authorization header if your global Axios interceptor
            // doesn't pick up 'voterSessionToken' or if you want to be sure.
            // If your lib/axios.ts interceptor is set to use 'voterSessionToken'
            // from localStorage, this might not be needed.
            Authorization: `Bearer ${voterSessionToken}`,
          },
        }
      );

      if (response.data && response.data.success) {
        setStatusMessage(response.data.message || 'Face verification successful (stubbed). Proceeding...');
        // Navigate to the next step after a short delay
        setTimeout(() => {
          navigate('/queue-display-stub'); // Navigate to your Queue Display Stub page route
        }, 2000); // 2-second delay to show success message
      } else {
        setError(response.data.message || 'Face verification failed (stubbed).');
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
          setError('No response from server for face verification stub. Please check connection.');
        } else {
          setError('Error setting up face verification stub request.');
        }
      } else if (err instanceof Error) {
        setError(`An unexpected error occurred: ${err.message}`);
      } else {
        setError('An unknown error occurred during face verification.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        
        {/* You could add a manual trigger button if not using useEffect for auto-trigger */}
        {/* {!isLoading && !statusMessage.includes('successful') && !error && (
          <Button onClick={handleVerifyFace} className="w-full py-3 text-base">
            Start Face Scan (Stub)
          </Button>
        )} */}

      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Secure eVoting System. All rights reserved.</p>
      </footer>
    </div>
  );
}
