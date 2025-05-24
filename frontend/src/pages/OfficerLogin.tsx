// frontend/src/pages/OfficerLogin.tsx
import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // useLocation removed as it was unused
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useOfficerAuth } from '@/store/useOfficerAuth'; // useOfficerAuthStatus removed as it was unused here
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
  const { login } = useOfficerAuth(); // Get the login action from the store

  useEffect(() => {
    // Log initial store state for reference when component mounts
    const initialStoreState = useOfficerAuth.getState();
    console.log(`[OfficerLogin] Initial component mount - Store State: Token: ${initialStoreState.token ? 'PRESENT' : 'NULL'}, HasHydrated: ${initialStoreState._hasHydrated}`);
    console.log('[OfficerLogin] Initial component mount - localStorage officer-auth-storage:', localStorage.getItem('officer-auth-storage'));
  }, []); // Empty dependency array, runs once on mount

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
        setError('Login failed: Invalid response from server.');
        setIsLoading(false);
        return;
      }
      
      console.log('[OfficerLogin] Calling store.login() with received token.');
      login(token, user); // Dispatch login action to update Zustand store

      const stateAfterLoginCall = useOfficerAuth.getState();
      console.log(`[OfficerLogin] State from useOfficerAuth.getState() immediately after login() call: Token: ${stateAfterLoginCall.token ? 'PRESENT' : 'NULL'}, HasHydrated: ${stateAfterLoginCall._hasHydrated}`);
      
      if (stateAfterLoginCall.token) {
        console.log('[OfficerLogin] Token IS SET in store (verified by getState()). Navigating to /officer/dashboard...');
        navigate('/officer/dashboard', { replace: true });
      } else {
        console.error('[OfficerLogin] CRITICAL ERROR: Token is NULL in store (verified by getState()) even after login() call. Navigation aborted.');
        setError('Login succeeded but local state update failed. Please try again.');
      }

    } catch (err) {
      console.error('[OfficerLogin] Login page API error:', err);
      let errorMessage = 'Login failed. An unexpected error occurred.';
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ErrorResponseData>;
        if (axiosError.response) {
          errorMessage = axiosError.response.data?.message || axiosError.response.data?.error || `Login failed: ${axiosError.response.statusText} (Status ${axiosError.response.status})`;
          if (axiosError.response.status === 401) {
            errorMessage = 'Invalid email or password.';
          }
        } else if (axiosError.request) {
          errorMessage = 'Login failed: No response from server. Check network.';
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