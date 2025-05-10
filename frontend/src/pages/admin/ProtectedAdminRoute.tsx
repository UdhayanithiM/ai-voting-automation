import React, { type JSX } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '@/store/useAdminAuth'


interface ProtectedAdminRouteProps {
  children: JSX.Element
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const token = useAdminAuth((state) => state.token)

  return token ? children : <Navigate to="/admin/login" replace />
}

export default ProtectedAdminRoute
