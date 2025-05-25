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
  const voterAuthState = useVoterAuth.getState();
  
  let tokenToSend: string | null = null;
  const url = config.url || ''; // Variable 'url' defined for request interceptor scope

  // Exclude token for initial public login/OTP requests
  if (url.startsWith('/auth/admin/login') || url.startsWith('/auth/officer/login') || url.startsWith('/auth/voter/initiate-otp-by-id') || url.startsWith('/auth/voter/verify-id-otp')) {
    tokenToSend = null;
  }
  // Voter-specific multi-step flow endpoints
  else if (url.startsWith('/verification/face-stub')) {
    tokenToSend = voterAuthState.otpToken;
    console.log(`[AxiosInterceptor Request] Using Voter OTP Token for ${url}`);
  }
  else if (url.startsWith('/queue/request-slot') || url.startsWith('/candidates') || url.startsWith('/vote')) {
    // These are voter actions and should use the votingToken
    tokenToSend = voterAuthState.votingToken;
    console.log(`[AxiosInterceptor Request] Using Voter Voting Token for ${url}`);
  }
  // Admin specific routes
  else if (url.startsWith('/admin/')) {
    tokenToSend = adminAuthState.token;
    console.log(`[AxiosInterceptor Request] Using Admin Token for ${url}`);
  }
  // Officer specific routes (including general /queue management if not voter's request-slot)
  else if (url.startsWith('/officer/') || url.startsWith('/queue')) { // General /queue for officer
    tokenToSend = officerAuthState.token;
    console.log(`[AxiosInterceptor Request] Using Officer Token for ${url}`);
  }
  // Fallback (optional, if you have other authenticated routes not fitting above categories)
  // else {
  //   if (voterAuthState.votingToken) tokenToSend = voterAuthState.votingToken;
  //   else if (voterAuthState.otpToken) tokenToSend = voterAuthState.otpToken;
  //   else if (officerAuthState.token) tokenToSend = officerAuthState.token;
  //   else if (adminAuthState.token) tokenToSend = adminAuthState.token;
  //   if (tokenToSend) console.log(`[AxiosInterceptor Request] Using Fallback Token for ${url}`);
  // }

  config.headers = config.headers || {};
  if (tokenToSend) {
    config.headers.Authorization = `Bearer ${tokenToSend}`;
    let tokenType = 'Unknown';
    if (tokenToSend === adminAuthState.token) tokenType = 'Admin';
    else if (tokenToSend === officerAuthState.token) tokenType = 'Officer';
    else if (tokenToSend === voterAuthState.otpToken) tokenType = 'Voter OTP';
    else if (tokenToSend === voterAuthState.votingToken) tokenType = 'Voter Voting';
    console.log(`[AxiosInterceptor Request] Authorization header SET for ${url} - Token Type: ${tokenType}`);
  } else {
    console.log(`[AxiosInterceptor Request] No Authorization header set for ${url}`);
  }
  return config;
});

// --- Response Interceptor ---
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    const currentPath = window.location.pathname;
    const requestUrl = originalRequest.url || ''; // Use originalRequest.url in response interceptor

    console.log(`[AxiosInterceptor Response] Error Status: ${err.response?.status} on Path: ${currentPath} for URL: ${requestUrl}`);

    if (err.response?.status === 401) {
      console.log('[AxiosInterceptor Response] Encountered 401 Error.');

      const isAdminLoginAttempt = requestUrl.includes('/auth/admin/login');
      const isOfficerLoginAttempt = requestUrl.includes('/auth/officer/login');
      const isVoterOtpInitiate = requestUrl.includes('/auth/voter/initiate-otp-by-id');
      const isVoterOtpVerify = requestUrl.includes('/auth/voter/verify-id-otp');

      if (isAdminLoginAttempt || isOfficerLoginAttempt || isVoterOtpInitiate || isVoterOtpVerify) {
        console.log('[AxiosInterceptor Response] 401 on a login/OTP API call. Component should handle this. No global logout.');
      }
      // Handle auto-logout for different roles if a token was presumably sent but was invalid
      else if (originalRequest.headers?.Authorization) { // Check if an auth header was even sent
        if (currentPath.startsWith('/admin/')) {
          const adminAuth = useAdminAuth.getState();
          if (adminAuth.token) { // Check if the store thought there was a token
            console.warn('[AxiosInterceptor Response] 401 on authenticated /admin/ route. Logging out admin.');
            adminAuth.logout();
          }
        } else if (currentPath.startsWith('/officer/')) {
          const officerAuth = useOfficerAuth.getState();
          if (officerAuth.token) { // Check if the store thought there was a token
            console.warn('[AxiosInterceptor Response] 401 on authenticated /officer/ route. Logging out officer.');
            officerAuth.logout();
          }
        } else if (
            // Voter specific paths that require auth and might trigger logout
            requestUrl.startsWith('/queue/request-slot') ||
            requestUrl.startsWith('/verification/face-stub') ||
            requestUrl.startsWith('/candidates') ||
            requestUrl.startsWith('/vote')
          ) {
          const voterAuth = useVoterAuth.getState();
          // Check if any voter token was active, indicating an authenticated voter session step failed
          if (voterAuth.otpToken || voterAuth.votingToken) {
             console.warn('[AxiosInterceptor Response] 401 on authenticated voter step. Clearing voter auth for URL:', requestUrl);
             voterAuth.clearAuth();
          }
        } else {
          console.log('[AxiosInterceptor Response] 401 on a path not triggering specific auto-logout, but auth header was present. Error should be handled by the component or a general redirect could be considered for URL:', requestUrl);
        }
      } else {
         console.log('[AxiosInterceptor Response] 401, but no auth header was sent from interceptor for this request. ProtectedRoute should handle redirect if it was an auth-required route for URL:', requestUrl);
      }
    }
    return Promise.reject(err);
  }
);

export default API;