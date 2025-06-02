// frontend/src/pages/voter/SelfieCaptureForRegistration.tsx
import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '@/lib/axios';
import axios, { AxiosError } from 'axios'; // For error type checking

interface RegistrationData {
  fullName: string;
  dob: string;
  address: string;
  phoneNumber: string;
  aadharNumber?: string;
  voterIdNumber?: string;
  registerNumber?: string;
}
interface LocationState {
  registrationData?: RegistrationData; // Make it optional to handle direct access case
}

interface BackendResponse {
  success: boolean;
  message: string;
  voter?: {
    _id: string;
    fullName: string;
    status: string;
  };
  error?: string; 
}

export default function SelfieCaptureForRegistration() {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccessMessage, setApiSuccessMessage] = useState<string | null>(null);

  // Safely access registrationData from location state
  const registrationData = (location.state as LocationState)?.registrationData;

  useEffect(() => {
    if (!registrationData) {
      console.warn("SelfieCaptureForRegistration: No registration data found in location state. Redirecting.");
      navigate('/self-registration/details', { replace: true });
    }
  }, [registrationData, navigate]);


  const handleCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot({width: 640, height: 480}); // Specify dimensions
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setUploadedImage(null); 
      setApiError(null);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation for file type and size (example)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setApiError('Invalid file type. Please upload JPG, PNG, or WEBP images.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setApiError('File is too large. Maximum 5MB allowed.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setCapturedImage(null); 
        setApiError(null);
      };
      reader.onerror = () => {
        setApiError("Failed to read the uploaded file.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSubmit = async () => {
    if (!registrationData) { // Should be caught by useEffect, but as a safeguard
        setApiError("Critical error: Registration details are missing.");
        return;
    }
    const selfieToSubmit = capturedImage || uploadedImage;
    if (!selfieToSubmit) {
      setApiError('Please capture or upload a selfie before submitting.');
      return;
    }

    setIsLoading(true);
    setApiError(null);
    setApiSuccessMessage(null);

    const completeFormData = {
      ...registrationData,
      photoUrl: selfieToSubmit, 
    };

    try {
      const response = await API.post<BackendResponse>('/voters/', completeFormData); 
      
      if (response.data.success) {
        setApiSuccessMessage(response.data.message || 'Registration successful! Pending approval.');
        setTimeout(() => {
          navigate('/self-registration/pending', { replace: true }); 
        }, 2500);
      } else {
        setApiError(response.data.message || response.data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Self-registration submission error:', err);
      let errorMessage = 'An unexpected error occurred during submission.';
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<BackendResponse>;
        const errorData = axiosError.response?.data;
        errorMessage = errorData?.message || errorData?.error || axiosError.message || 'Failed to submit. Please check details and try again.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const displayImage = capturedImage || uploadedImage;

  if (!registrationData) { // Render a loading/redirecting state if data is not yet available
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Loading details or redirecting...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-100 to-cyan-100 px-4 py-12">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 md:p-10 space-y-6 border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 text-center">Step 2: Capture or Upload Selfie</h1>
        
        <div className="w-64 h-64 bg-slate-200 rounded-xl flex items-center justify-center overflow-hidden mx-auto border-2 border-dashed border-slate-300">
          {displayImage ? (
            <img src={displayImage} alt="Selfie preview" className="object-cover w-full h-full" />
          ) : (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
              mirrored={true}
            />
          )}
        </div>

        {apiError && (
          <p className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">{apiError}</p>
        )}
        {apiSuccessMessage && (
          <p className="text-green-700 text-sm text-center bg-green-50 p-3 rounded-md border border-green-200">{apiSuccessMessage}</p>
        )}

        {!apiSuccessMessage && (
          <div className="space-y-3 pt-2">
            {!displayImage ? (
              <>
                <Button onClick={handleCapture} className="w-full py-2.5" variant="outline">
                  📸 Capture Selfie
                </Button>
                <div className="text-center text-xs text-slate-500 py-1">OR</div>
                <input
                  type="file"
                  id="upload-selfie-input"
                  accept="image/jpeg, image/png, image/webp"
                  onChange={handleUpload}
                  className="sr-only"
                  aria-label="Upload Selfie from device" 
                />
                <Button 
                  onClick={() => document.getElementById('upload-selfie-input')?.click()} 
                  className="w-full py-2.5" 
                  variant="outline"
                  aria-controls="upload-selfie-input" 
                >
                  ⬆️ Upload Photo from Device
                </Button>
              </>
            ) : (
              <div className="flex flex-col space-y-3">
                 <Button onClick={handleFinalSubmit} className="w-full py-3 text-base bg-sky-600 hover:bg-sky-700 text-white" disabled={isLoading}>
                  {isLoading ? 'Submitting Registration...' : 'Submit Registration'}
                </Button>
                <Button onClick={() => { setCapturedImage(null); setUploadedImage(null); setApiError(null);}} variant="link" className="text-sm text-sky-600 hover:text-sky-700">
                  Retake or Re-upload
                </Button>
              </div>
            )}
          </div>
        )}
         <Button 
            variant="link" 
            onClick={() => navigate('/self-registration/details', { state: { registrationData }, replace: true })} 
            className="w-full mt-2 text-sm text-slate-600 hover:text-sky-700" 
            disabled={isLoading || !!apiSuccessMessage}
        >
            Back to Details
        </Button>
      </div>
    </div>
  );
}