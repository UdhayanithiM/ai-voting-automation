// src/pages/voter/VoterIdEntryPage.tsx
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios'; // Import AxiosError for better error typing
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import API from '@/lib/axios';

// Interface for the expected error response from the backend
interface ErrorResponseData {
  error?: string; // If backend sends error in { "error": "message" }
  message?: string; // Or if backend sends error in { "message": "message" }
}

// Interface for the expected success response from your initiate-otp-by-id endpoint
interface InitiateOtpSuccessData {
    success?: boolean; // Making this optional as your backend might not send it
    message: string;   // Expecting a message on success
    phoneHint?: string;
    contextIdentifiers?: {
        aadharNumber: string;
        registerNumber: string;
    };
}

export default function VoterIdEntryPage() {
  const [aadharNumber, setAadharNumber] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!aadharNumber.trim() || !registerNumber.trim()) {
      setError('Both Aadhaar Number and Register Number are required.');
      return;
    }
    if (!/^\d{12}$/.test(aadharNumber)) {
      setError('Aadhaar Number must be 12 digits.');
      return;
    }
    // Add any specific validation for registerNumber if needed

    setIsLoading(true);

    try {
      const response = await API.post<InitiateOtpSuccessData>('/auth/voter/initiate-otp-by-id', {
        aadharNumber,
        registerNumber,
      });

      // Check if the response indicates success.
      // Your backend sends a 200 OK with a specific message for success.
      // It does not seem to send a `success: true` field based on your authController.
      // So, we'll infer success if the API call itself didn't throw an error (caught by catch block)
      // AND if the message is the expected success message.
      // A more robust backend would return an explicit success flag.
      if (response.status === 200 && response.data && response.data.message === "OTP has been sent to your registered mobile number.") {
        localStorage.setItem('aadharNumberForOtp', aadharNumber);
        localStorage.setItem('registerNumberForOtp', registerNumber);
        if (response.data.phoneHint) {
          localStorage.setItem('otpPhoneHint', response.data.phoneHint);
        }
        console.log('OTP Initiated successfully, navigating to /verify-otp');
        navigate('/verify-otp');
      } else {
        // If backend returns 200 but not the expected success message, or an explicit success: false
        setError(response.data.message || 'Failed to initiate OTP. Unexpected response from server.');
      }
    } catch (err: unknown) { // Changed from 'any' to 'unknown' for type safety
      console.error('Error initiating OTP:', err);
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ErrorResponseData>;
        if (axiosError.response?.data) {
          // Use the error message from the backend if available
          setError(axiosError.response.data.error || axiosError.response.data.message || 'An error occurred while requesting OTP.');
        } else if (axiosError.request) {
          setError('No response from server. Please check your network or if the server is running.');
        } else {
          setError('Error setting up the request to the server.');
        }
      } else if (err instanceof Error) { // Handle generic JavaScript errors
        setError(`An unexpected error occurred: ${err.message}`);
      } else {
         setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 px-4 py-12">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8 md:p-10 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Voter Identification</h1>
          <p className="mt-2 text-sm text-gray-600">
            Please enter your Aadhaar and College Register Number to proceed.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="aadharNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Aadhaar Number
            </label>
            <Input
              id="aadharNumber"
              type="text"
              placeholder="Enter your 12-digit Aadhaar"
              value={aadharNumber}
              onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, '').slice(0,12))}
              disabled={isLoading}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="registerNumber" className="block text-sm font-medium text-gray-700 mb-1">
              College Register Number
            </label>
            <Input
              id="registerNumber"
              type="text"
              placeholder="Enter your College ID"
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value.toUpperCase())}
              disabled={isLoading}
              required
              className="mt-1"
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full py-3 text-base">
            {isLoading ? 'Processing...' : 'Request OTP'}
          </Button>
        </form>
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Secure eVoting System. All rights reserved.</p>
      </footer>
    </div>
  );
}
