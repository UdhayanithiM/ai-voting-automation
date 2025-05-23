import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios'; // For types, and direct use in catch block
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import API from '@/lib/axios'; // Your pre-configured Axios instance

// Define types for expected data structures
type IdentifierType = 'AADHAAR' | 'VOTER_ID'; //

interface BackendErrorResponse { //
  error?: string;
  message?: string;
}

interface RequestOtpSuccessResponse { //
  success: boolean;
  message: string;
  phoneHint?: string; // Optional: if backend provides a hint
}

export default function VoterIdEntryPage() {
  const [identifierType, setIdentifierType] = useState<IdentifierType>('AADHAAR'); //
  const [identifierValue, setIdentifierValue] = useState(''); //
  const [isLoading, setIsLoading] = useState(false); //
  const [error, setError] = useState<string | null>(null); //
  const navigate = useNavigate(); //

  const handleIdentifierTypeChange = (value: string) => { //
    setIdentifierType(value as IdentifierType); //
    setIdentifierValue(''); // Reset value when type changes
    setError(null); // Clear error when type changes
  };

  const handleIdentifierValueChange = (e: ChangeEvent<HTMLInputElement>) => { //
    const { value } = e.target; //
    // Basic input filtering
    if (identifierType === 'AADHAAR') { //
      setIdentifierValue(value.replace(/\D/g, '').slice(0, 12)); // Allow only numbers, max 12 digits for Aadhaar
    } else if (identifierType === 'VOTER_ID') { //
      setIdentifierValue(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15)); // Example: Alphanumeric, max 15 for Voter ID
    } else {
      setIdentifierValue(value); //
    }
    setError(null); //
  };

  const validateInput = (): boolean => { //
    if (!identifierValue.trim()) { //
      setError(`Please enter your ${identifierType === 'AADHAAR' ? 'Aadhaar Number' : 'Voter ID'}.`); //
      return false; //
    }
    if (identifierType === 'AADHAAR' && identifierValue.length !== 12) { //
      setError('Aadhaar Number must be 12 digits.'); //
      return false; //
    }
    // Example validation for Voter ID length
    if (identifierType === 'VOTER_ID' && (identifierValue.length < 6 || identifierValue.length > 15)) { //
      setError('Voter ID format is invalid.'); //
      return false; //
    }
    return true; //
  };

  const handleSubmit = async (e: FormEvent) => { //
    e.preventDefault(); //
    setError(null); //

    if (!validateInput()) { //
      return; //
    }

    setIsLoading(true); //
    try {
      // THIS IS THE CORRECTED LINE:
      const response = await API.post<RequestOtpSuccessResponse>('/auth/voter/initiate-otp-by-id', { //
        identifierType: identifierType, //
        identifierValue: identifierValue, //
      });

      console.log('VoterIdEntryPage.tsx: OTP Request API Response:', response.data); //

      if (response.data && response.data.success) { //
        // Store necessary info for the VerifyOtpPage
        localStorage.setItem('otpIdentifierType', identifierType); //
        localStorage.setItem('otpIdentifierValue', identifierValue); //
        if (response.data.phoneHint) { //
          localStorage.setItem('otpPhoneHint', response.data.phoneHint); //
        } else {
          localStorage.removeItem('otpPhoneHint'); //
        }

        console.log('VoterIdEntryPage: OTP Request successful, navigating to /verify-otp. Data for next page:', //
          { identifierType, identifierValue, phoneHint: response.data.phoneHint } //
        );
        navigate('/verify-otp'); //
      } else {
        setError(response.data?.message || 'Failed to request OTP. Please check your details.'); //
      }
    } catch (err: unknown) { //
      console.error('Request OTP error in VoterIdEntryPage.tsx:', err); //
      if (axios.isAxiosError(err)) { //
        const axiosError = err as AxiosError<BackendErrorResponse>; //
        if (axiosError.response?.data) { //
          setError(axiosError.response.data.message || axiosError.response.data.error || 'An error occurred while requesting OTP.'); //
        } else if (axiosError.request) { //
          setError('No response from server. Please try again later.'); //
        } else {
          setError('Error setting up OTP request. Please try again.'); //
        }
      } else {
        setError('An unexpected error occurred. Please try again.'); //
      }
    } finally {
      setIsLoading(false); //
    }
  };

  // JSX part remains the same as you provided
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 px-4 py-12">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8 md:p-10 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Voter Identification</h1>
          <p className="mt-2 text-sm text-gray-600">
            Please select your ID type and enter the number to request an OTP.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Select ID Type:</Label>
            <RadioGroup
              defaultValue={identifierType}
              onValueChange={handleIdentifierTypeChange}
              className="flex space-x-4"
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="AADHAAR" id="type-aadhaar" />
                <Label htmlFor="type-aadhaar" className="cursor-pointer">Aadhaar Number</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="VOTER_ID" id="type-voterid" />
                <Label htmlFor="type-voterid" className="cursor-pointer">Voter ID</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="identifierValue" className="block text-sm font-medium text-gray-700 mb-1">
              {identifierType === 'AADHAAR' ? 'Aadhaar Number' : 'Voter ID Number'}
            </Label>
            <Input
              id="identifierValue"
              type="text"
              placeholder={`Enter your ${identifierType === 'AADHAAR' ? '12-digit Aadhaar' : 'Voter ID'}`}
              value={identifierValue}
              onChange={handleIdentifierValueChange}
              disabled={isLoading}
              required
              maxLength={identifierType === 'AADHAAR' ? 12 : 15}
              className="mt-1"
            />
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm" role="alert">
              <p>{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !identifierValue.trim()}
            className="w-full py-3 text-base"
          >
            {isLoading ? 'Requesting OTP...' : 'Request OTP'}
          </Button>
        </form>
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Secure eVoting System. All rights reserved.</p>
      </footer>
    </div>
  );
}