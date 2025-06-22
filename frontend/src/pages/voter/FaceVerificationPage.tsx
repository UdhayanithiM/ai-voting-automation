// frontend/src/pages/voter/FaceVerificationPage.tsx
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/Button';
import API from '@/lib/axios';
import { useVoterAuth } from '@/store/useVoterAuth';
import axios, { AxiosError } from 'axios';

export default function FaceVerificationPage() {
  const navigate = useNavigate();
  const { otpToken, setVotingToken, clearAuth } = useVoterAuth();
  const webcamRef = useRef<Webcam>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Please position your face in the center.');

  const handleVerification = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setError("Could not capture image from webcam.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusMessage('Verifying your identity...');

    try {
      const response = await API.post('/verification/face-verify', {
        livePhotoData: imageSrc,
      });

      if (response.data.success && response.data.token) {
        setStatusMessage('Verification successful! Redirecting...');
        setVotingToken(response.data.token);
        setTimeout(() => navigate('/queue-display-stub'), 1500);
      } else {
        throw new Error(response.data.message || "An unknown error occurred.");
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Face did not match or an error occurred. Please try again.';
      setError(errorMessage);
      setStatusMessage('Verification Failed');
      setIsLoading(false);
    }
  }, [navigate, setVotingToken]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-red-100 px-4 py-12">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8 space-y-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Face Verification</h1>
        <p className="text-gray-600">{statusMessage}</p>

        <div className="w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-gray-300">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'user', width: 400, height: 400 }}
            mirrored={true}
          />
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <Button
          onClick={handleVerification}
          disabled={isLoading}
          className="w-full py-3 text-lg"
        >
          {isLoading ? 'Processing...' : 'Capture and Verify'}
        </Button>
      </div>
    </div>
  );
}