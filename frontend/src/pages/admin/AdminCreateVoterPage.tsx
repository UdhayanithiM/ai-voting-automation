// frontend/src/pages/admin/AdminCreateVoterPage.tsx
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import API from '@/lib/axios';
import axios, { AxiosError } from 'axios';

// Interface for the form data
interface CreateVoterFormData {
  fullName: string;
  dob: string; // Expected format YYYY-MM-DD
  address: string;
  phoneNumber: string;
  aadharNumber?: string;
  voterIdNumber?: string;
  registerNumber?: string;
  photoUrl?: string; // Optional URL for a photo
}

// Interface for expected backend success response
interface BackendSuccessResponse {
  success: boolean;
  message: string;
  voter?: { 
    _id: string;
    fullName: string;
    status: string;
    approved: boolean;
  };
}

// Interface for expected backend error response
interface BackendErrorResponse {
  success?: boolean;
  message: string;
  error?: string;
}

type FormErrors = Partial<CreateVoterFormData> & { form?: string };

export default function AdminCreateVoterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateVoterFormData>({
    fullName: '',
    dob: '',
    address: '',
    phoneNumber: '',
    aadharNumber: '',
    voterIdNumber: '',
    registerNumber: '',
    photoUrl: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponseMessage, setApiResponseMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CreateVoterFormData] || errors.form) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof CreateVoterFormData];
        delete newErrors.form;
        return newErrors;
      });
    }
    setApiResponseMessage(null);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!formData.dob) newErrors.dob = 'Date of Birth is required.';
    if (!formData.address.trim()) newErrors.address = 'Address is required.';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required.';
    else if (!/^\d{10,15}$/.test(formData.phoneNumber)) newErrors.phoneNumber = 'Invalid phone number (10-15 digits).';

    if (!formData.aadharNumber?.trim() && !formData.voterIdNumber?.trim() && !formData.registerNumber?.trim()) {
      newErrors.form = 'At least one Government ID (Aadhaar, Voter ID, or Register No.) is required.';
    } else {
      if (formData.aadharNumber && !/^\d{12}$/.test(formData.aadharNumber)) {
        newErrors.aadharNumber = 'Aadhaar must be 12 digits.';
      }
      if (formData.voterIdNumber && (formData.voterIdNumber.length < 3 || formData.voterIdNumber.length > 20)) {
        newErrors.voterIdNumber = 'Voter ID format appears invalid.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiResponseMessage(null);
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.post<BackendSuccessResponse>('/admin/voters/create-direct', formData);
      if (response.data.success) {
        setApiResponseMessage({ type: 'success', message: response.data.message || 'Voter created successfully!' });
        setFormData({ 
          fullName: '', dob: '', address: '', phoneNumber: '',
          aadharNumber: '', voterIdNumber: '', registerNumber: '', photoUrl: ''
        });
        // setTimeout(() => { navigate('/admin/dashboard/voters'); }, 2000); // Optional: navigate after success
      } else {
        setApiResponseMessage({ type: 'error', message: response.data.message || 'Failed to create voter.' });
      }
    } catch (err) {
      console.error('Admin create voter error:', err);
      let errorMessage = 'An unknown error occurred.';
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data as BackendErrorResponse;
        errorMessage = errorData?.message || err.message || 'Failed to create voter. Please check details and try again.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setApiResponseMessage({ type: 'error', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-xl border border-slate-200">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-8 text-center">Create New Voter (Admin Panel)</h1>

      {apiResponseMessage && (
        <div className={`p-4 rounded-lg mb-6 text-sm font-medium border ${apiResponseMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'}`}>
          {apiResponseMessage.message}
        </div>
      )}
      {errors.form && !apiResponseMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-md mb-6 text-sm">
            <p>{errors.form}</p>
          </div>
        )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="fullName" className="text-slate-700">Full Name <span className="text-red-500">*</span></Label>
            <Input id="fullName" name="fullName" type="text" placeholder="Voter's full name" value={formData.fullName} onChange={handleChange} required className="mt-1.5" />
            {errors.fullName && <p className="text-red-500 text-xs mt-1.5">{errors.fullName}</p>}
          </div>
          <div>
            <Label htmlFor="dob" className="text-slate-700">Date of Birth <span className="text-red-500">*</span></Label>
            <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} required className="mt-1.5" max={new Date().toISOString().split("T")[0]} />
            {errors.dob && <p className="text-red-500 text-xs mt-1.5">{errors.dob}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="address" className="text-slate-700">Full Address <span className="text-red-500">*</span></Label>
          <textarea id="address" name="address" placeholder="Voter's full address" value={formData.address} onChange={handleChange} required rows={3}
            className="w-full mt-1.5 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm" />
          {errors.address && <p className="text-red-500 text-xs mt-1.5">{errors.address}</p>}
        </div>
        <div>
          <Label htmlFor="phoneNumber" className="text-slate-700">Phone Number <span className="text-red-500">*</span></Label>
          <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="10-15 digit phone number" value={formData.phoneNumber} onChange={handleChange} required className="mt-1.5" />
          {errors.phoneNumber && <p className="text-red-500 text-xs mt-1.5">{errors.phoneNumber}</p>}
        </div>
        
        <p className="text-sm text-slate-500 pt-3">Government ID (at least one required):</p>
        <div>
          <Label htmlFor="aadharNumber" className="text-slate-700">Aadhaar Number (12 digits)</Label>
          <Input id="aadharNumber" name="aadharNumber" type="text" placeholder="Enter Aadhaar (optional)" value={formData.aadharNumber || ''} onChange={handleChange} maxLength={12} className="mt-1.5" />
          {errors.aadharNumber && <p className="text-red-500 text-xs mt-1.5">{errors.aadharNumber}</p>}
        </div>
        <div>
          <Label htmlFor="voterIdNumber" className="text-slate-700">Voter ID Number</Label>
          <Input id="voterIdNumber" name="voterIdNumber" type="text" placeholder="Enter Voter ID (optional)" value={formData.voterIdNumber || ''} onChange={handleChange} className="mt-1.5" />
          {errors.voterIdNumber && <p className="text-red-500 text-xs mt-1.5">{errors.voterIdNumber}</p>}
        </div>
        <div>
          <Label htmlFor="registerNumber" className="text-slate-700">Register Number (Optional)</Label>
          <Input id="registerNumber" name="registerNumber" type="text" placeholder="Enter Register Number (optional)" value={formData.registerNumber || ''} onChange={handleChange} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="photoUrl" className="text-slate-700">Photo URL (Optional)</Label>
          <Input id="photoUrl" name="photoUrl" type="url" placeholder="https://example.com/photo.jpg" value={formData.photoUrl || ''} onChange={handleChange} className="mt-1.5" />
        </div>

        <Button type="submit" className="w-full py-3 text-base mt-6 bg-sky-600 hover:bg-sky-700 text-white" disabled={isLoading}>
          {isLoading ? 'Creating Voter...' : 'Create and Approve Voter'}
        </Button>
      </form>
       <Button variant="outline" onClick={() => navigate('/admin/dashboard/voters')} className="w-full mt-4 border-slate-300 text-slate-600 hover:bg-slate-50">
            Back to Voter Table
       </Button>
    </div>
  );
}