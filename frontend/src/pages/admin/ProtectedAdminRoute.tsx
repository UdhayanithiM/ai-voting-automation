import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '@/store/useAdminAuth'

interface ProtectedAdminRouteProps {
  children: React.ReactElement
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const isAuthenticated = useAdminAuth((state) => state.isAuthenticated)

  return isAuthenticated ? children : <Navigate to="/admin/login" replace />
}
