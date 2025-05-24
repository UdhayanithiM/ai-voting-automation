// frontend/src/lib/axios.ts
import axios from 'axios';
import { useVoterAuth } from '@/store/useVoterAuth'; 
import { useOfficerAuth } from '@/store/useOfficerAuth'; // ✅ Correctly imported

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const voterAuthState = useVoterAuth.getState();
  // ✅ GET OFFICER TOKEN CORRECTLY
  const officerAuthState = useOfficerAuth.getState(); // Get officer auth state
  let tokenToSend: string | null = null;
  const url = config.url || '';

  // For Admin or Officer specific routes, use the Officer token
  if (url.startsWith('/admin/') || url.startsWith('/officer/') || url.startsWith('/auth/admin/') || url.startsWith('/auth/officer/')) {
    tokenToSend = officerAuthState.token; // Use token from useOfficerAuth store
    // console.log('[AxiosInterceptor] Using Officer/Admin Token:', tokenToSend ? tokenToSend.substring(0,10) + '...' : 'null');
  } else if (url.startsWith('/verification/face-stub')) {
    tokenToSend = voterAuthState.otpToken;
  } else if (url.startsWith('/queue/request-slot') || url.startsWith('/candidates') || url.startsWith('/vote')) {
    tokenToSend = voterAuthState.votingToken;
  }
  // No need to check localStorage.getItem('token') here if Zustand is the source of truth for officer token

  config.headers = config.headers || {};
  if (tokenToSend) {
    config.headers.Authorization = `Bearer ${tokenToSend}`;
    // console.log(`[AxiosInterceptor] Sending token for ${url}: Bearer ${tokenToSend.substring(0, 10)}...`);
  } else {
    // console.log(`[AxiosInterceptor] No specific token identified for ${url}.`);
  }
  return config;
});

// Response interceptor (your existing one)
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const currentPath = window.location.pathname;
      console.log('[AxiosInterceptor] 401 Error on path:', currentPath); // Log current path

      if (currentPath.startsWith('/admin')) {
        // useAdminAuth.getState().logout(); // If you have this
        localStorage.removeItem('admin-auth-storage'); // Or whatever your admin store name is
        window.location.href = '/admin/login';
      } else if (currentPath.startsWith('/officer')) {
        useOfficerAuth.getState().logout(); // ✅ This is correct for officer
        window.location.href = '/officer/login';
      } else if (currentPath.startsWith('/voter-id-entry')) {
        useVoterAuth.getState().clearAuth();
        window.location.href = '/voter-id-entry';
      } else {
        // Fallback for other 401s if needed, or let them be handled by component
        // For instance, a general login for a user role not covered above
        // localStorage.removeItem('some-other-token');
        // window.location.href = '/login'; 
      }
    }
    return Promise.reject(err);
  }
);

export default API;