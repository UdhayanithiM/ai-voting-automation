// frontend/src/pages/OfficerLogin.tsx
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input'; // Ensure path is correct
import { Button } from '@/components/ui/Button'; // Ensure path is correct
import { useOfficerAuth } from '@/store/useOfficerAuth'; // Ensure path is correct
import API from '@/lib/axios'; // Your pre-configured Axios instance
import axios, { AxiosError } from 'axios'; // Import AxiosError and axios

// Define a type for the expected error response data from your backend
interface ErrorResponseData {
  message: string;
  // Add any other properties your error response might have
}

export default function OfficerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useOfficerAuth();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await API.post('/auth/officer/login', {
        email,
        password,
      });

      const { token, user } = response.data;

      if (!token || !user || !user.id || !user.email) {
        console.error('Login error: Token or essential user data missing in response', response.data);
        setError('Login failed: Invalid response from server. Please try again.');
        setIsLoading(false);
        return;
      }

      login(token, user);
      navigate('/officer/dashboard');

    } catch (err) { // ESLint error was here
      console.error('Login page error:', err);
      setIsLoading(false); // Ensure loading is stopped on error

      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ErrorResponseData>; // Type assertion with your custom error data type
        if (axiosError.response && axiosError.response.data && axiosError.response.data.message) {
          setError(axiosError.response.data.message); // Show backend error message
        } else if (axiosError.request) {
          setError('Login failed: No response from server. Check network or if server is running.');
        } else {
          setError('Login failed: An unexpected error occurred while setting up the request.');
        }
      } else if (err instanceof Error) { // Handle generic errors
        setError(`Login failed: ${err.message}`);
      } else { // Handle unknown errors
        setError('Login failed: An unknown error occurred. Please try again.');
      }
    } finally {
      // This block will always execute, but setIsLoading(false) is already in catch.
      // If there are scenarios where it's not set in catch, ensure it here.
      // For instance, if the try block itself could throw a non-Axios error not caught by the specific checks.
      // However, the current structure should cover it.
      // setIsLoading(false); // Already handled, but good to be mindful.
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">Officer Login</h1>
        {error && (
          <p className="text-red-500 text-center bg-red-100 p-3 rounded-md">
            {error}
          </p>
        )}
        <form className="space-y-4" onSubmit={handleLogin}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>
      </div>
    </div>
  );
}