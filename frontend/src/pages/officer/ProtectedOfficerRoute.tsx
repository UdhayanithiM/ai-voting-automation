// frontend/src/pages/officer/ProtectedOfficerRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// Import the new granular hooks and the base store hook
import { useIsOfficerAuthenticated, useOfficerHasHydrated, useOfficerToken, useOfficerAuth } from '@/store/useOfficerAuth';

interface ProtectedOfficerRouteProps {
  children: React.ReactNode;
}

const ProtectedOfficerRoute: React.FC<ProtectedOfficerRouteProps> = ({ children }) => {
  const isAuthenticated = useIsOfficerAuthenticated();
  const hasHydrated = useOfficerHasHydrated();
  const tokenFromHook = useOfficerToken(); // For logging consistency if needed
  const location = useLocation();

  useEffect(() => {
    const directStoreState = useOfficerAuth.getState();
    console.log(
        `[ProtectedOfficerRoute] useEffect - Path: ${location.pathname}. ` +
        `Hook_IsAuth: ${isAuthenticated}, Hook_HasHydrated: ${hasHydrated}, Hook_Token: ${tokenFromHook ? 'PRESENT' : 'NULL'}. ` +
        `DirectStore_Token: ${directStoreState.token ? 'PRESENT' : 'NULL'}, DirectStore_Hydrated: ${directStoreState._hasHydrated}`
    );
  }, [location.pathname, isAuthenticated, hasHydrated, tokenFromHook]);

  const directStoreStateOnRender = useOfficerAuth.getState(); // For logging current direct state
  console.log(
    `[ProtectedOfficerRoute] Rendering. Path: ${location.pathname}. ` +
    `Hook_IsAuth: ${isAuthenticated}, Hook_HasHydrated: ${hasHydrated}, Hook_Token: ${tokenFromHook ? 'PRESENT' : 'NULL'}. ` +
    `DirectStore_Token: ${directStoreStateOnRender.token ? 'PRESENT' : 'NULL'}, DirectStore_Hydrated: ${directStoreStateOnRender._hasHydrated}`
  );

  if (!hasHydrated) {
      console.log('[ProtectedOfficerRoute] Store not hydrated yet (hasHydrated from hook is false). Displaying loading indicator.');
      // You might want a more sophisticated loading spinner/component here
      return <div className="flex justify-center items-center min-h-screen">Loading Authentication...</div>;
  }

  if (isAuthenticated) {
    console.log('[ProtectedOfficerRoute] Authenticated. Rendering children for path:', location.pathname);
    return <>{children}</>;
  } else {
    console.log(`[ProtectedOfficerRoute] NOT Authenticated (isAuthenticated is false, hasHydrated is true). Redirecting to /officer/login from path: ${location.pathname}`);
    return <Navigate to="/officer/login" replace state={{ from: location }} />;
  }
};

export default ProtectedOfficerRoute;