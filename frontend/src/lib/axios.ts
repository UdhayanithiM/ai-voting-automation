// frontend/src/lib/axios.ts
import axios from 'axios';
import { useVoterAuth } from '@/store/useVoterAuth';
import { useOfficerAuth } from '@/store/useOfficerAuth';
import { useAdminAuth } from '@/store/useAdminAuth';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// --- Request Interceptor ---
API.interceptors.request.use((config) => {
  const officerAuthState = useOfficerAuth.getState();
  const adminAuthState = useAdminAuth.getState();
  const voterAuthState = useVoterAuth.getState(); // Assuming voter store might be needed for other routes
  
  let tokenToSend: string | null = null;
  const url = config.url || '';

  // Exclude token for initial login/OTP requests
  if (url.startsWith('/auth/admin/login') || url.startsWith('/auth/officer/login') || url.startsWith('/auth/send-otp') || url.startsWith('/auth/verify-otp')) {
    tokenToSend = null; 
  } else if (url.startsWith('/admin/')) { // Admin specific routes (excluding login)
    tokenToSend = adminAuthState.token;
  } else if (url.startsWith('/officer/')) { // Officer specific routes (excluding login)
    tokenToSend = officerAuthState.token;
  } else if (url.startsWith('/queue')) { 
    // Specifically for /queue requests, which officer dashboard uses.
    // This assumes that /queue for an officer context requires the officer token.
    // If voter/admin also use /queue with different tokens, this logic needs to be more sophisticated,
    // potentially checking current application path or having distinct API endpoints.
    // For now, we prioritize officer token if available for /queue.
    if (officerAuthState.token) {
        tokenToSend = officerAuthState.token;
        console.log(`[AxiosInterceptor Request] Prioritizing Officer Token for generic queue URL: ${url}`);
    } else if (voterAuthState.votingToken && (url.includes('request-slot') || url.includes('candidates') || url.includes('vote'))) {
        // Fallback or specific voter queue/vote related logic if officer token not applicable/present
        tokenToSend = voterAuthState.votingToken;
    }
  } else if (url.startsWith('/verification/face-stub')) { // Voter specific
    tokenToSend = voterAuthState.otpToken;
  } else if (url.startsWith('/candidates') || url.startsWith('/vote')) { // Voter specific
    tokenToSend = voterAuthState.votingToken;
  }
  // else {
  //   // Fallback for any other authenticated routes if a primary role token is available
  //   // This is a general catch-all and might need to be more nuanced
  //   if (officerAuthState.token) tokenToSend = officerAuthState.token;
  //   else if (adminAuthState.token) tokenToSend = adminAuthState.token;
  //   else if (voterAuthState.otpToken) tokenToSend = voterAuthState.otpToken; 
  //   else if (voterAuthState.votingToken) tokenToSend = voterAuthState.votingToken;
  // }

  config.headers = config.headers || {};
  if (tokenToSend) {
    config.headers.Authorization = `Bearer ${tokenToSend}`;
    console.log(`[AxiosInterceptor Request] Authorization header SET for ${url} - Token Type: ${officerAuthState.token === tokenToSend ? 'Officer' : adminAuthState.token === tokenToSend ? 'Admin' : 'Voter/Other' }`);
  } else {
    console.log(`[AxiosInterceptor Request] No Authorization header set for ${url}`);
  }
  return config;
});

// --- Response Interceptor (Correction from previous turn is assumed to be applied) ---
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
      
      if (isOfficerLoginAttempt || isAdminLoginAttempt) {
        console.log('[AxiosInterceptor Response] 401 on a login API call. Component should handle this. No global logout.');
      } 
      else if (currentPath.startsWith('/officer/')) {
        const officerAuth = useOfficerAuth.getState();
        if (officerAuth.token) { 
          console.warn('[AxiosInterceptor Response] 401 on an authenticated /officer/ route. Logging out officer via store.');
          officerAuth.logout();
        } else {
          console.log('[AxiosInterceptor Response] 401 on /officer/ path, but no officer token was in store. ProtectedOfficerRoute should handle redirect.');
        }
      } 
      else if (currentPath.startsWith('/admin/')) {
        const adminAuth = useAdminAuth.getState();
        if (adminAuth.token) {
          console.warn('[AxiosInterceptor Response] 401 on an authenticated /admin/ route. Logging out admin via store.');
          adminAuth.logout();
        } else {
           console.log('[AxiosInterceptor Response] 401 on /admin/ path, but no admin token was in store. ProtectedAdminRoute should handle redirect.');
        }
      }
      // Add specific handling for voter tokens if necessary
      // else if (currentPath.startsWith('/voter/') || originalRequest.url.includes('/vote') || originalRequest.url.includes('/queue')) {
      //   const voterAuth = useVoterAuth.getState();
      //   if (voterAuth.otpToken || voterAuth.votingToken) {
      //     console.warn('[AxiosInterceptor Response] 401 on a voter route/action. Logging out voter via store.');
      //     voterAuth.clearAuth(); // Assuming voter store has a similar logout action
      //   }
      // }
      else {
        console.log('[AxiosInterceptor Response] 401 on a path not triggering specific auto-logout. Error should be handled by the component.');
      }
    }
    return Promise.reject(err); 
  }
);

export default API;