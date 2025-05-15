// src/pages/VerifyOtp.tsx
import { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import API from '@/lib/axios';
import { useVoterAuth } from '@/store/useVoterAuth';

interface BackendErrorResponseData {
  error?: string;
  message?: string;
}

interface BackendVerifyOtpSuccessData {
  success: boolean;
  token: string;
  voter: {
    id: string;
    phone: string;
  };
  message: string;
}

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setOtpToken = useVoterAuth.getState().setOtpToken;
  const setVoterDetails = useVoterAuth.getState().setVoterDetails;

  const navigationAttemptedRef = useRef(false);
  const phoneHint = localStorage.getItem('otpPhoneHint');

  useEffect(() => {
    if (navigationAttemptedRef.current) return;

    const aadharFromStorage = localStorage.getItem('aadharNumberForOtp');
    const registerFromStorage = localStorage.getItem('registerNumberForOtp');

    if (!aadharFromStorage || !registerFromStorage) {
      console.warn('VerifyOtpPage: Mount check - Aadhaar/Register number missing. Navigating to ID entry.');
      navigationAttemptedRef.current = true;
      navigate('/voter-id-entry', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError(null);
  };

  const handleVerifyOtp = async (currentOtp: string) => {
    if (navigationAttemptedRef.current && isLoading) return;

    if (currentOtp.length !== 6) {
      setError('OTP must be 6 digits.');
      return;
    }

    const currentAadhar = localStorage.getItem('aadharNumberForOtp');
    const currentRegister = localStorage.getItem('registerNumberForOtp');

    if (!currentAadhar || !currentRegister) {
      setError('Required voter identifiers are missing. Please go back and enter them.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await API.post<BackendVerifyOtpSuccessData>('/auth/voter/verify-id-otp', {
        aadharNumber: currentAadhar,
        registerNumber: currentRegister,
        otp: currentOtp,
      });

      console.log('Backend response in VerifyOtp.tsx:', response.data);

      if (response.data && response.data.success === true && response.data.token && response.data.voter && response.data.voter.id) {
        setOtpToken(response.data.token); // ✅ set otpToken in Zustand
        setVoterDetails(response.data.voter); // ✅ store voter details in Zustand

        localStorage.removeItem('aadharNumberForOtp');
        localStorage.removeItem('registerNumberForOtp');
        localStorage.removeItem('otpPhoneHint');

        console.log('SUCCESS CONDITION MET: Setting navigationAttemptedRef and navigating to /face-verification-stub');
        navigationAttemptedRef.current = true;
        navigate('/face-verification-stub');
        return;
      } else {
        setError(response.data?.message || 'Verification failed: Invalid response from server.');
      }
    } catch (err: unknown) {
      console.error('OTP Verification error (catch block):', err);
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<BackendErrorResponseData>;
        if (axiosError.response?.data) {
          setError(axiosError.response.data.error || axiosError.response.data.message || 'Invalid OTP or a server error occurred.');
        } else if (axiosError.request) {
          setError('Verification failed: No response from server.');
        } else {
          setError('Verification failed: Error setting up request.');
        }
      } else if (err instanceof Error) {
        setError(`An error occurred: ${err.message}`);
      } else {
        setError('An unknown error occurred.');
      }
    }
    setIsLoading(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleVerifyOtp(otp);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-teal-50 to-cyan-100 px-4 py-12">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8 md:p-10 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Verify OTP</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter the 6-digit code sent to your registered mobile number
            {phoneHint && ` ending in ...${phoneHint.slice(-4)}`}.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md my-3" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1 sr-only">
              OTP
            </label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={handleChange}
              disabled={isLoading}
              required
              maxLength={6}
              className="mt-1 text-center text-2xl tracking-[0.3em] font-mono"
            />
          </div>

          <Button type="submit" disabled={isLoading || otp.length !== 6} className="w-full py-3 text-base">
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </form>

        <div className="text-center mt-4">
          <Button
            variant="link"
            onClick={() => {
              if (!isLoading) {
                navigationAttemptedRef.current = true;
                navigate('/voter-id-entry');
              }
            }}
            disabled={isLoading}
          >
            Go Back
          </Button>
        </div>
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Secure eVoting System. All rights reserved.</p>
      </footer>
    </div>
  );
}
