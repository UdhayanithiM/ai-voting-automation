// frontend/src/pages/officer/ProtectedOfficerRoute.tsx
import React, { type JSX } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useOfficerAuthStatus } from '@/store/useOfficerAuth'; 

interface ProtectedOfficerRouteProps {
  children: JSX.Element;
}

const ProtectedOfficerRoute: React.FC<ProtectedOfficerRouteProps> = ({ children }) => {
  const { isAuthenticated, hasHydrated } = useOfficerAuthStatus(); 
  const location = useLocation();

  // Log current status for debugging
  // React.useEffect(() => {
  //   console.log('[ProtectedOfficerRoute] Status Update - Location:', location.pathname, 'Hydrated:', hasHydrated, 'IsAuth:', isAuthenticated);
  // }, [location.pathname, hasHydrated, isAuthenticated]);

  if (!hasHydrated) {
    // console.log('[ProtectedOfficerRoute] Store not hydrated yet. Returning loading indicator.');
    return <div className="flex justify-center items-center min-h-screen">Loading Authentication...</div>; 
  }

  // console.log('[ProtectedOfficerRoute] Store is hydrated. IsAuth:', isAuthenticated);
  if (isAuthenticated) { 
    return children; 
  } else {
    // console.log('[ProtectedOfficerRoute] Not authenticated after hydration. Redirecting to login.');
    return <Navigate to="/officer/login" replace state={{ from: location }} />;
  }
};

export default ProtectedOfficerRoute;