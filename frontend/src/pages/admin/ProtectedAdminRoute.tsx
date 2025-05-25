// frontend/src/pages/admin/ProtectedAdminRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth, useAdminHasHydrated } from '@/store/useAdminAuth'; // Import useAdminHasHydrated

interface ProtectedAdminRouteProps {
  children: React.ReactElement;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const token = useAdminAuth((state) => state.token);
  const hasHydrated = useAdminHasHydrated(); // Use the specific hydration hook
  const location = useLocation();

  if (!hasHydrated) {
    // You can show a global loading spinner or a minimal loading message
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading authentication state...</p>
        {/* Or a spinner component */}
      </div>
    );
  }

  if (!token) {
    // User is not authenticated after hydration, redirect to login
    // Pass the current location to redirect back after login
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // User is authenticated and store is hydrated, render the children
  return children;
};

export default ProtectedAdminRoute;