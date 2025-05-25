// frontend/src/pages/admin/AdminLogin.tsx
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import API from '@/lib/axios';
import { useAdminAuth } from '@/store/useAdminAuth';
import axios, { AxiosError } from 'axios';

// Ensure this interface matches the 'user' object structure in the login response
interface AdminUserData {
  id: string;
  email: string;
  role: string; // Expect 'role' from backend
}
interface AdminLoginResponse {
  success: boolean;
  token: string;
  user: AdminUserData; 
  message?: string;
}

interface ErrorResponseData {
  message: string;
  error?: string;
  success?: boolean; // Backend might send success: false
}

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await API.post<AdminLoginResponse>('/auth/admin/login', { email, password });
      
      if (res.data && res.data.success && res.data.token && res.data.user) {
        // Log the user object to verify role is present
        console.log('[AdminLogin] Login successful, user data from backend:', res.data.user);
        
        // Check if role is 'admin' before proceeding (optional client-side check)
        if (res.data.user.role !== 'admin') {
            setError('Login successful, but user is not an authorized admin.');
            setIsLoading(false);
            // Optionally call logout if a non-admin token was somehow set
            // useAdminAuth.getState().logout(); 
            return;
        }

        login(res.data.token, res.data.user); // Zustand login handles persistence
        // localStorage.setItem('token', res.data.token); // REMOVED - let Zustand persist handle storage
        navigate('/admin/dashboard');
      } else {
        setError(res.data?.message || 'Login failed: Invalid response from server.');
      }
    } catch (err) {
      console.error('Admin Login error:', err);
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ErrorResponseData>;
        if (axiosError.response?.data?.message) {
          setError(axiosError.response.data.message);
        } else {
          setError('Invalid credentials or server error during login.');
        }
      } else {
        setError('An unexpected error occurred during login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">Admin Login</h1>
        {error && (
          <p className="text-red-500 text-center bg-red-100 p-3 rounded-md mb-4 text-sm">
            {error}
          </p>
        )}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              id="admin-email"
              type="email"
              name="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              id="admin-password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full py-2.5" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
}