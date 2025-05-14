// src/routes/ProtectedVoterAuthRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useVoterAuth } from '@/store/useVoterAuth'; // Your Zustand store for voter session

interface ProtectedVoterAuthRouteProps {
  children?: React.ReactNode;
}

const ProtectedVoterAuthRoute: React.FC<ProtectedVoterAuthRouteProps> = ({ children }) => {
  // Select the token. If the token exists, we assume the voter object in the store is also valid
  // as they should be set together by voterAuthLogin.
  // This selector is more stable as it directly returns a potentially null value or a string.
  const token = useVoterAuth((state) => state.token);
  const location = useLocation();

  const isAuthenticated = !!token; // Simplified check: if token exists, consider authenticated for routing.
                                  // Your API calls will still be validated by the backend using this token.

  // Logging for debug purposes
  React.useEffect(() => {
    console.log(
      '[ProtectedVoterAuthRoute] Effect Check:',
      { token, isAuthenticated, currentPath: location.pathname }
    );
  }, [token, isAuthenticated, location.pathname]);


  if (!isAuthenticated) {
    console.log(
      `[ProtectedVoterAuthRoute] Not authenticated (token: ${token}). Path: ${location.pathname}. Redirecting to /voter-id-entry.`
    );
    // Redirect to the voter ID entry page if not authenticated.
    // Save the current location so we can send them back after login.
    return <Navigate to="/voter-id-entry" state={{ from: location }} replace />;
  }

  // If authenticated, render the children (the protected page) or an Outlet for nested routes.
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedVoterAuthRoute;
