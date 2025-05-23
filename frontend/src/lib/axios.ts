import axios from 'axios';
import { useVoterAuth } from '@/store/useVoterAuth'; 
import { useOfficerAuth } from '@/store/useOfficerAuth'; // ❗️ ADD THIS IMPORT// Import your voter auth store

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const voterAuthState = useVoterAuth.getState(); // Get current state of voter auth store
  let tokenToSend: string | null = null;

  // Determine which token to use based on the URL or other context
  // This logic needs to align with your API routes and auth flow.
  const url = config.url || '';

  if (url.startsWith('/auth/admin/') || url.startsWith('/admin/') || url.startsWith('/auth/officer/') || url.startsWith('/officer/')) {
    // For Admin or Officer specific routes, use the token from localStorage
    tokenToSend = localStorage.getItem('token');
  } else if (url.startsWith('/verification/face-stub')) {
    // For face verification, the voter should have an otpToken
    tokenToSend = voterAuthState.otpToken;
  } else if (url.startsWith('/queue/request-slot') || url.startsWith('/candidates') || url.startsWith('/vote')) {
    // For queue, candidates, or voting, the voter should have a votingToken
    tokenToSend = voterAuthState.votingToken;
  }
  // Add more conditions if you have other voter routes that might use voterAuthState.token (a generic voter session token)

  config.headers = config.headers || {};
  if (tokenToSend) {
    config.headers.Authorization = `Bearer ${tokenToSend}`;
    console.log(`[AxiosInterceptor] Sending token for ${url}: Bearer ${tokenToSend.substring(0, 10)}...`); // Log for debugging
  } else {
    console.log(`[AxiosInterceptor] No specific token identified for ${url}. localStorage token: ${localStorage.getItem('token') ? 'found' : 'not found'}.`);
  }

  return config;
});

// Optional: response interceptor for handling 401 errors
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Clear tokens and redirect based on the area of the app
      if (currentPath.startsWith('/admin')) {
        localStorage.removeItem('token'); // Assuming admin token is the generic one
        // Potentially clear admin zustand store if you have one: useAdminAuth.getState().logout();
        window.location.href = '/admin/login';
      } else if (currentPath.startsWith('/officer')) {
        localStorage.removeItem('token'); // Assuming officer token is the generic one
        useOfficerAuth.getState().logout(); // Use your officer logout function
        window.location.href = '/officer/login';
      } else if (currentPath.startsWith('/voter-id-entry') || currentPath.startsWith('/verify-otp') || currentPath.startsWith('/face-verification-stub') || currentPath.startsWith('/queue-display-stub') || currentPath.startsWith('/voting-page-stub')) {
        // For voter flow, clear voter-specific tokens and redirect to start
        useVoterAuth.getState().clearAuth();
        window.location.href = '/voter-id-entry';
      } else {
        // Default fallback if route is unknown or for general pages
        localStorage.removeItem('token');
        window.location.href = '/login'; // Or a generic public login page
      }
    }
    return Promise.reject(err);
  }
);

export default API;