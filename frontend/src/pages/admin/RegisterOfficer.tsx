// frontend/src/pages/admin/RegisterOfficer.tsx
import { useState, FormEvent, ChangeEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import API from '@/lib/axios'; // Use the global API instance
import axios, { AxiosError } from 'axios'; // For AxiosError type

interface OfficerFormData {
  name: string;
  email: string;
  password: string;
}

// Define expected response structures
interface OfficerCreationSuccessResponse {
  message: string;
  officer?: { // Officer details might be returned
    id: string;
    name: string;
    email: string;
  };
}

interface ErrorResponseData {
  message: string;
  error?: string; // Backend might send an 'error' field too
}

export default function RegisterOfficer() {
  const [form, setForm] = useState<OfficerFormData>({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccessMessage(null); // Clear messages on new input
    setErrorMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!form.name || !form.email || !form.password) {
        setErrorMessage("All fields (name, email, password) are required.");
        setLoading(false);
        return;
    }
    if (form.password.length < 6) { // Example validation
        setErrorMessage("Password must be at least 6 characters long.");
        setLoading(false);
        return;
    }

    try {
      // The Axios interceptor will automatically add the admin token
      const response = await API.post<OfficerCreationSuccessResponse>('/admin/officers', form);
      setSuccessMessage(response.data.message || '✅ Officer registered successfully!');
      setForm({ name: '', email: '', password: '' }); // Clear form on success
    } catch (err: unknown) { // Use unknown for better type safety
      console.error('Register officer error:', err);
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ErrorResponseData>; // Type assertion
        setErrorMessage(axiosError.response?.data?.message || axiosError.message || '❌ Failed to register officer.');
      } else if (err instanceof Error) {
        setErrorMessage(`❌ An unexpected error occurred: ${err.message}`);
      } else {
        setErrorMessage('❌ Failed to register officer due to an unknown error.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-6 md:p-8 rounded-xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">Register New Polling Officer</h1>
      {successMessage && <p className="text-sm text-center my-3 text-green-700 bg-green-100 p-3 rounded-md">{successMessage}</p>}
      {errorMessage && <p className="text-sm text-center my-3 text-red-700 bg-red-100 p-3 rounded-md">{errorMessage}</p>}
      
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="officer-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <Input 
              id="officer-name"
              name="name" 
              placeholder="Enter officer's full name" 
              value={form.name} 
              onChange={handleChange} 
              required 
              className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="officer-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <Input 
              id="officer-email"
              name="email" 
              type="email"
              placeholder="officer@example.com" 
              value={form.email} 
              onChange={handleChange} 
              required
              className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="officer-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <Input
            id="officer-password"
            name="password"
            placeholder="Enter temporary password (min. 6 characters)"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6} 
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full py-2.5 text-base">
          {loading ? 'Registering Officer...' : 'Register Officer'}
        </Button>
      </form>
    </div>
  );
}