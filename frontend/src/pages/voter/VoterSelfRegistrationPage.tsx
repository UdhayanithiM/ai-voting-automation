// frontend/src/pages/voter/VoterSelfRegistrationPage.tsx
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label'; // Assuming you have this from Radix or similar

interface RegistrationFormData {
  fullName: string;
  dob: string; // Expected format YYYY-MM-DD
  address: string;
  phoneNumber: string;
  aadharNumber?: string;
  voterIdNumber?: string;
  registerNumber?: string;
}

type FormErrors = Partial<RegistrationFormData> & { form?: string };

export default function VoterSelfRegistrationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    dob: '',
    address: '',
    phoneNumber: '',
    aadharNumber: '',
    voterIdNumber: '',
    registerNumber: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof RegistrationFormData] || errors.form) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof RegistrationFormData];
        delete newErrors.form;
        return newErrors;
      });
    }
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    // Navigate to selfie capture, passing current form data via route state
    navigate('/self-registration/selfie', { state: { registrationData: formData } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 px-4 py-12">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8 md:p-10 border border-slate-200">
        <h1 className="text-3xl font-bold text-slate-800 text-center mb-8">Voter Self-Registration</h1>
        
        {errors.form && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3.5 rounded-md mb-6 text-sm shadow-sm">
            <p className="font-medium">Please correct the following issue:</p>
            <p>{errors.form}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></Label>
            <Input id="fullName" name="fullName" type="text" placeholder="Enter your full name" value={formData.fullName} onChange={handleChange} required className="mt-1" />
            {errors.fullName && <p className="text-red-500 text-xs mt-1.5">{errors.fullName}</p>}
          </div>

          <div>
            <Label htmlFor="dob" className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth <span className="text-red-500">*</span></Label>
            <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} required className="mt-1" max={new Date().toISOString().split("T")[0]} />
            {errors.dob && <p className="text-red-500 text-xs mt-1.5">{errors.dob}</p>}
          </div>

          <div>
            <Label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">Full Address <span className="text-red-500">*</span></Label>
            <textarea id="address" name="address" placeholder="Enter your full address" value={formData.address} onChange={handleChange} required rows={3}
              className="w-full mt-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
            />
            {errors.address && <p className="text-red-500 text-xs mt-1.5">{errors.address}</p>}
          </div>

          <div>
            <Label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number <span className="text-red-500">*</span></Label>
            <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="Enter your mobile number" value={formData.phoneNumber} onChange={handleChange} required className="mt-1" />
            {errors.phoneNumber && <p className="text-red-500 text-xs mt-1.5">{errors.phoneNumber}</p>}
          </div>
          
          <p className="text-sm text-slate-600 pt-2 mb-1">Please provide at least one Government ID:</p>
          
          <div>
            <Label htmlFor="aadharNumber" className="block text-sm font-medium text-slate-700 mb-1.5">Aadhaar Number (12 digits)</Label>
            <Input id="aadharNumber" name="aadharNumber" type="text" placeholder="Enter Aadhaar (optional)" value={formData.aadharNumber || ''} onChange={handleChange} maxLength={12} className="mt-1" />
            {errors.aadharNumber && <p className="text-red-500 text-xs mt-1.5">{errors.aadharNumber}</p>}
          </div>

          <div>
            <Label htmlFor="voterIdNumber" className="block text-sm font-medium text-slate-700 mb-1.5">Voter ID Number</Label>
            <Input id="voterIdNumber" name="voterIdNumber" type="text" placeholder="Enter Voter ID (optional, e.g., ABC1234567)" value={formData.voterIdNumber || ''} onChange={handleChange} className="mt-1" />
            {errors.voterIdNumber && <p className="text-red-500 text-xs mt-1.5">{errors.voterIdNumber}</p>}
          </div>

          <div>
            <Label htmlFor="registerNumber" className="block text-sm font-medium text-slate-700 mb-1.5">Register Number (if applicable)</Label>
            <Input id="registerNumber" name="registerNumber" type="text" placeholder="Enter Register Number (optional)" value={formData.registerNumber || ''} onChange={handleChange} className="mt-1" />
            {/* Add error display if needed for registerNumber */}
          </div>

          <Button type="submit" className="w-full py-3 text-base mt-6 bg-sky-600 hover:bg-sky-700 text-white">
            Proceed to Selfie Capture
          </Button>
        </form>
        <Button variant="link" onClick={() => navigate('/')} className="w-full mt-4 text-sky-600 hover:text-sky-700">
            Back to Welcome
        </Button>
      </div>
    </div>
  );
}