// frontend/src/pages/officer/ProtectedOfficerRoute.tsx
import React, { useEffect } from 'react'; // React import handles JSX for modern TS/React setups
import { Navigate, useLocation } from 'react-router-dom';
import { useOfficerAuthStatus, useOfficerAuth } from '@/store/useOfficerAuth';

interface ProtectedOfficerRouteProps {
  children: React.ReactNode; // Use React.ReactNode for children prop type
}

const ProtectedOfficerRoute: React.FC<ProtectedOfficerRouteProps> = ({ children }) => {
  const { isAuthenticated, hasHydrated, token: tokenFromHook } = useOfficerAuthStatus(); 
  const location = useLocation();

  useEffect(() => {
    const directStoreState = useOfficerAuth.getState();
    console.log(
        `[ProtectedOfficerRoute] useEffect - Path: ${location.pathname}. ` +
        `Hook_IsAuth: ${isAuthenticated}, Hook_HasHydrated: ${hasHydrated}, Hook_Token: ${tokenFromHook ? 'PRESENT' : 'NULL'}. ` +
        `DirectStore_Token: ${directStoreState.token ? 'PRESENT' : 'NULL'}, DirectStore_Hydrated: ${directStoreState._hasHydrated}`
    );
  }, [location.pathname, isAuthenticated, hasHydrated, tokenFromHook]);

  const directStoreStateOnRender = useOfficerAuth.getState();
  console.log(
    `[ProtectedOfficerRoute] Rendering. Path: ${location.pathname}. ` +
    `Hook_IsAuth: ${isAuthenticated}, Hook_HasHydrated: ${hasHydrated}, Hook_Token: ${tokenFromHook ? 'PRESENT' : 'NULL'}. ` +
    `DirectStore_Token: ${directStoreStateOnRender.token ? 'PRESENT' : 'NULL'}, DirectStore_Hydrated: ${directStoreStateOnRender._hasHydrated}`
  );

  if (!hasHydrated) {
     console.log('[ProtectedOfficerRoute] Store not hydrated yet (hasHydrated from hook is false). Displaying loading indicator.');
     return <div className="flex justify-center items-center min-h-screen">Loading Authentication... (Protected Route)</div>;
  }

  if (isAuthenticated) {
    console.log('[ProtectedOfficerRoute] Authenticated (isAuthenticated from hook is true). Rendering children for path:', location.pathname);
    return <>{children}</>; // Render children directly
  } else {
    console.log(`[ProtectedOfficerRoute] NOT Authenticated (isAuthenticated from hook is false, while hasHydrated is true). Token from hook was ${tokenFromHook ? 'PRESENT' : 'NULL'}. Redirecting to /officer/login from path: ${location.pathname}`);
    return <Navigate to="/officer/login" replace state={{ from: location }} />;
  }
};

export default ProtectedOfficerRoute;