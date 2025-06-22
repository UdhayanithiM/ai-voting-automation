import axios from 'axios';
import { useVoterAuth } from '@/store/useVoterAuth';
import { useOfficerAuth } from '@/store/useOfficerAuth';
import { useAdminAuth } from '@/store/useAdminAuth';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// --- Request Interceptor (Corrected Logic) ---
API.interceptors.request.use((config) => {
  const { token: adminToken } = useAdminAuth.getState();
  const { token: officerToken } = useOfficerAuth.getState();
  const { otpToken, votingToken } = useVoterAuth.getState();
  
  const url = config.url || '';
  let tokenToSend: string | null = null;
  let tokenType = 'None';

  // --- CORRECTED LOGIC ---
  // Define route groups, with specific voter routes checked FIRST for priority.
  const OTP_TOKEN_ROUTES = ['/verification/face-verify'];
  const VOTER_QUEUE_ROUTES = ['/queue/request-slot'];
  const VOTING_TOKEN_ROUTES = ['/candidates', '/vote'];
  
  const ADMIN_ROUTES = ['/admin/'];
  const OFFICER_ROUTES = ['/officer/', '/queue/']; // General officer routes

  if (OTP_TOKEN_ROUTES.some(route => url.startsWith(route))) {
    tokenToSend = otpToken;
    tokenType = 'Voter OTP';
  } else if (VOTER_QUEUE_ROUTES.some(route => url.startsWith(route))) {
    tokenToSend = votingToken;
    tokenType = 'Voter Voting';
  } else if (VOTING_TOKEN_ROUTES.some(route => url.startsWith(route))) {
    tokenToSend = votingToken;
    tokenType = 'Voter Voting';
  } else if (ADMIN_ROUTES.some(route => url.startsWith(route))) {
    tokenToSend = adminToken;
    tokenType = 'Admin';
  } else if (OFFICER_ROUTES.some(route => url.startsWith(route))) {
    tokenToSend = officerToken;
    tokenType = 'Officer';
  }

  if (tokenToSend) {
    config.headers.Authorization = `Bearer ${tokenToSend}`;
    console.log(`[AxiosInterceptor Request] Attaching ${tokenType} token for URL: ${url}`);
  } else {
    console.log(`[AxiosInterceptor Request] No token attached for public URL: ${url}`);
  }
  
  return config;
});

// Response Interceptor remains the same...
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    // ... (error handling logic remains the same)
    return Promise.reject(err);
  }
);

export default API;