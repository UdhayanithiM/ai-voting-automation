// src/routes/ProtectedVoterAuthRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useVoterAuth } from '@/store/useVoterAuth';

export interface ProtectedVoterAuthRouteProps {
  children: React.ReactElement;
  /** Specifies which token is primarily required for this route */
  tokenType?: 'otpTokenRequired' | 'votingTokenRequired' | 'genericTokenRequired' | 'anyVoterTokenRequired';
}

const ProtectedVoterAuthRoute: React.FC<ProtectedVoterAuthRouteProps> = ({
  children,
  tokenType = 'anyVoterTokenRequired',
}) => {
  const otpToken = useVoterAuth((state) => state.otpToken);
  const votingToken = useVoterAuth((state) => state.votingToken);
  const genericToken = useVoterAuth((state) => state.token);
  const location = useLocation();

  let isAuthenticated = false;
  let determinedRedirectPath = '/'; // Default redirect to a safe public page

  switch (tokenType) {
    case 'otpTokenRequired':
      isAuthenticated = !!otpToken;
      determinedRedirectPath = '/voter-id-entry';
      break;
    case 'votingTokenRequired':
      isAuthenticated = !!votingToken;
      determinedRedirectPath = otpToken ? '/face-verification-stub' : '/voter-id-entry';
      break;
    case 'genericTokenRequired':
      isAuthenticated = !!genericToken;
      determinedRedirectPath = '/'; // Or your generic login page
      break;
    case 'anyVoterTokenRequired': // This means any token that signifies an active voter session part
    default:
      isAuthenticated = !!otpToken || !!votingToken; 
      determinedRedirectPath = '/voter-id-entry';
      break;
  }
  
  useEffect(() => {
    console.log(
      `[ProtectedVoterAuthRoute] Path: ${location.pathname}, ` +
      `ReqToken: ${tokenType}, ` +
      `HasGeneric: ${!!genericToken}, `+
      `HasOTP: ${!!otpToken}, ` +
      `HasVoting: ${!!votingToken}, ` +
      `Auth: ${isAuthenticated}`
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, tokenType, genericToken, otpToken, votingToken]);

  if (!isAuthenticated) {
    if (location.pathname === determinedRedirectPath) {
      console.warn(`[ProtectedVoterAuthRoute] Infinite redirect prevented for ${location.pathname}. Check token flow.`);
      return <div>Session access error. Please <a href="/voter-id-entry" className="start-over-link">start over</a>.</div>;
    }
    return <Navigate to={determinedRedirectPath} state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedVoterAuthRoute;