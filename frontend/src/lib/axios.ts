// frontend/src/lib/axios.ts
import axios from 'axios';
import { useVoterAuth } from '@/store/useVoterAuth';
import { useOfficerAuth } from '@/store/useOfficerAuth';
import { useAdminAuth } from '@/store/useAdminAuth'; // Ensure this store exists and is set up

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// --- Request Interceptor ---
API.interceptors.request.use((config) => {
  const voterAuthState = useVoterAuth.getState();
  const officerAuthState = useOfficerAuth.getState();
  const adminAuthState = useAdminAuth.getState(); 
  
  let tokenToSend: string | null = null;
  const url = config.url || '';

  // Do not send token for initial login/OTP requests
  if (url.startsWith('/auth/admin/login') || url.startsWith('/auth/officer/login') || url.startsWith('/auth/send-otp') || url.startsWith('/auth/verify-otp')) {
    tokenToSend = null; 
    // console.log(`[AxiosInterceptor Request] No token sent for initial auth URL: ${url}`);
  } else if (url.startsWith('/admin/')) {
    tokenToSend = adminAuthState.token;
    // console.log(`[AxiosInterceptor Request] Using Admin Token for ${url}. Token: ${tokenToSend ? 'PRESENT' : 'NULL'}`);
  } else if (url.startsWith('/officer/')) {
    tokenToSend = officerAuthState.token;
    // console.log(`[AxiosInterceptor Request] Using Officer Token for ${url}. Token: ${tokenToSend ? 'PRESENT' : 'NULL'}`);
  } else if (url.startsWith('/verification/face-stub')) {
    tokenToSend = voterAuthState.otpToken;
  } else if (url.startsWith('/queue/request-slot') || url.startsWith('/candidates') || url.startsWith('/vote')) {
    tokenToSend = voterAuthState.votingToken;
  }

  config.headers = config.headers || {};
  if (tokenToSend) {
    config.headers.Authorization = `Bearer ${tokenToSend}`;
    // console.log(`[AxiosInterceptor Request] Authorization header set for ${url}`);
  } else {
    // console.log(`[AxiosInterceptor Request] No Authorization header set for ${url}`);
  }
  return config;
});

// --- Response Interceptor (Further Refined) ---
API.interceptors.response.use(
  (res) => res, 
  async (err) => {
    const originalRequest = err.config; 
    const currentPath = window.location.pathname; 

    console.log(`[AxiosInterceptor Response] Error Status: ${err.response?.status} on Path: ${currentPath} for URL: ${originalRequest.url}`);

    if (err.response?.status === 401) {
      console.log('[AxiosInterceptor Response] Encountered 401 Error.');

      const isOfficerLoginAttempt = originalRequest.url?.includes('/auth/officer/login');
      const isAdminLoginAttempt = originalRequest.url?.includes('/auth/admin/login');

      // If 401 was on the login page itself, do NOT logout globally. Let the login page show "invalid credentials".
      if (isOfficerLoginAttempt || isAdminLoginAttempt) {
        console.log('[AxiosInterceptor Response] 401 occurred on a login API call. Component should handle this (e.g., show "invalid credentials"). No global logout.');
      } 
      // If on an officer path (and it was NOT a login attempt that failed with 401)
      // AND an officer token was present (meaning they were authenticated or just logged in),
      // then assume the token is now invalid/expired.
      else if (currentPath.startsWith('/officer/')) {
        if (useOfficerAuth.getState().token) { // Check if there was a token
          console.warn('[AxiosInterceptor Response] 401 on an authenticated /officer/ route (and not a login attempt). Logging out officer.');
          useOfficerAuth.getState().logout(); 
          window.location.href = '/officer/login'; 
        } else {
          // No token, but on an officer path. Should ideally be caught by ProtectedOfficerRoute,
          // but redirect as a fallback if somehow bypassed.
          console.log('[AxiosInterceptor Response] 401 on /officer/ path, but no officer token was in store. Redirecting to login as a fallback.');
          window.location.href = '/officer/login';
        }
      } 
      // Handle admin routes similarly
      else if (currentPath.startsWith('/admin/')) {
        if (useAdminAuth.getState().token) {
          console.warn('[AxiosInterceptor Response] 401 on an authenticated /admin/ route (and not a login attempt). Logging out admin.');
          useAdminAuth.getState().logout();
          window.location.href = '/admin/login';
        } else {
           console.log('[AxiosInterceptor Response] 401 on /admin/ path, but no admin token was in store. Redirecting to login as a fallback.');
           window.location.href = '/admin/login';
        }
      }
      // Handle other specific cases if needed
      // else if (/* other conditions for voter, etc. */) { ... }
      else {
        console.log('[AxiosInterceptor Response] 401 on a path not triggering specific auto-logout. Error should be handled by the component that made the API call.');
      }
    }
    // ALWAYS reject the promise so the calling code (e.g., SWR, component's .catch() block)
    // can also receive and handle the error as needed.
    return Promise.reject(err); 
  }
);

export default API;