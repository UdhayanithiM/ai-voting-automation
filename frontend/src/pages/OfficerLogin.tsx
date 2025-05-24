// frontend/src/pages/OfficerLogin.tsx
import { useState, FormEvent, useEffect } from 'react'; // Added useEffect
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useOfficerAuth } from '@/store/useOfficerAuth';
import API from '@/lib/axios';
import axios, { AxiosError } from 'axios';

interface ErrorResponseData {
  message: string;
  error?: string;
}

export default function OfficerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Get the login function and the whole store for logging
  const { login } = useOfficerAuth();
  const officerAuthStore = useOfficerAuth(); // To access getState for logging

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    console.log('[OfficerLogin] handleLogin started.');

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      const response = await API.post('/auth/officer/login', {
        email: normalizedEmail,
        password: trimmedPassword,
      });
      console.log('[OfficerLogin] Backend login response successful:', response.data);

      const { token, user } = response.data;

      if (!token || !user || !user.id || !user.email) {
        console.error('[OfficerLogin] Login error: Token or essential user data missing in response', response.data);
        setError('Login failed: Invalid response from server. Please try again.');
        setIsLoading(false);
        return;
      }
      
      console.log('[OfficerLogin] Calling store.login() with token:', token ? token.substring(0,10)+'...' : null);
      login(token, user); // Update Zustand store

      // ✅ Log the state from the store AND from localStorage immediately after calling login
      // It might take a micro-task for persist to write to localStorage, so we check after a short delay
      // However, the in-memory state from useOfficerAuth.getState() should be immediate.
      console.log('[OfficerLogin] State immediately after login() call (in-memory):', useOfficerAuth.getState());
      
      // Check localStorage after a very short delay to give persist middleware a chance
      setTimeout(() => {
          console.log('[OfficerLogin] localStorage officer-auth-storage (after short delay):', localStorage.getItem('officer-auth-storage'));
      }, 100); // 100ms delay, adjust if needed

      console.log('[OfficerLogin] Navigating to /officer/dashboard...');
      navigate('/officer/dashboard');

    } catch (err) {
      console.error('[OfficerLogin] Login page API error:', err);
      let errorMessage = 'Login failed. An unexpected error occurred. Please try again.';
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ErrorResponseData>;
        if (axiosError.response) {
          errorMessage = axiosError.response.data?.message || axiosError.response.data?.error || `Login failed: ${axiosError.response.statusText} (Status ${axiosError.response.status})`;
          if (axiosError.response.status === 401) {
            errorMessage = 'Invalid email or password.';
          }
        } else if (axiosError.request) {
          errorMessage = 'Login failed: No response from server. Check network or if server is running.';
        }
      } else if (err instanceof Error) {
        errorMessage = `Login failed: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('[OfficerLogin] handleLogin finished.');
    }
  };

  // Log initial store state for reference
  useEffect(() => {
    console.log('[OfficerLogin] Initial component mount - officer auth state:', officerAuthStore);
    console.log('[OfficerLogin] Initial component mount - localStorage officer-auth-storage:', localStorage.getItem('officer-auth-storage'));
  }, [officerAuthStore]); // Added officerAuthStore to dependency array

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