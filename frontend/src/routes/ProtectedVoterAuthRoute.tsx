// src/routes/ProtectedVoterAuthRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useVoterAuth } from '@/store/useVoterAuth';

export interface ProtectedVoterAuthRouteProps {
  children: React.ReactElement;
  tokenType?: 'otpTokenRequired' | 'votingTokenRequired' | 'genericTokenRequired' | 'anyVoterTokenRequired';
}

const ProtectedVoterAuthRoute: React.FC<ProtectedVoterAuthRouteProps> = ({
  children,
  tokenType = 'anyVoterTokenRequired',
}) => {
  const otpToken = useVoterAuth((state) => state.otpToken);
  const votingToken = useVoterAuth((state) => state.votingToken);
  const genericToken = useVoterAuth((state) => state.token); // Assuming you might use this for a general voter session
  const location = useLocation();

  let isAuthenticated = false;
  let determinedRedirectPath = '/voter-id-entry'; // Default to the start of the voter flow

  switch (tokenType) {
    case 'otpTokenRequired':
      // If otpToken is present, user is authenticated for this step.
      // OR, if otpToken is now null BUT votingToken IS present,
      // it means the user JUST successfully completed the step guarded by otpToken
      // and received the votingToken. We allow this transition.
      isAuthenticated = !!otpToken || (otpToken === null && !!votingToken);
      if (!isAuthenticated) {
        determinedRedirectPath = '/voter-id-entry';
      }
      // If isAuthenticated is true due to votingToken being present,
      // the component (FaceVerificationStubPage) will navigate away shortly.
      // This check prevents redirect if we are in a valid transition.
      break;

    case 'votingTokenRequired':
      isAuthenticated = !!votingToken;
      if (!isAuthenticated) {
        // If votingToken is required but missing, redirect.
        // If otpToken is still around, maybe to face-verification, else to start.
        determinedRedirectPath = otpToken ? '/face-verification-stub' : '/voter-id-entry';
      }
      break;

    case 'genericTokenRequired':
      isAuthenticated = !!genericToken;
      determinedRedirectPath = '/'; // Or your generic voter login page
      break;

    case 'anyVoterTokenRequired': // Fallback for any active part of the voter session
    default:
      isAuthenticated = !!otpToken || !!votingToken || !!genericToken;
      if (!isAuthenticated) {
        determinedRedirectPath = '/voter-id-entry';
      }
      break;
  }
  
  // This useEffect is for logging and can be kept or removed in production
  useEffect(() => {
    console.log(
      `[ProtectedVoterAuthRoute] Path: ${location.pathname}, ReqToken: ${tokenType}, ` +
      `HasGeneric: ${!!genericToken}, HasOTP: ${!!otpToken}, HasVoting: ${!!votingToken}, Auth: ${isAuthenticated}`
    );
  }, [location.pathname, tokenType, genericToken, otpToken, votingToken, isAuthenticated]); // Added isAuthenticated

  if (!isAuthenticated) {
    // Prevent infinite redirect loops if already on the determinedRedirectPath
    if (location.pathname === determinedRedirectPath) {
      console.warn(`[ProtectedVoterAuthRoute] Infinite redirect prevented for ${location.pathname}. Current auth state does not permit access.`);
      // Provide a more user-friendly message or a way to recover
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <p className="text-red-500 font-semibold text-lg">Session access error or invalid state.</p>
            <p className="mt-2">Please <a href="/voter-id-entry" className="text-blue-600 hover:underline">click here to start over</a>.</p>
        </div>
      );
    }
    return <Navigate to={determinedRedirectPath} state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedVoterAuthRoute;