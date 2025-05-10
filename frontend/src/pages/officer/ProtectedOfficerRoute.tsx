import React, { type JSX } from 'react'
import { Navigate } from 'react-router-dom'
import { useOfficerAuth } from '@/store/useOfficerAuth'

interface ProtectedOfficerRouteProps {
  children: JSX.Element
}

const ProtectedOfficerRoute: React.FC<ProtectedOfficerRouteProps> = ({ children }) => {
  const token = useOfficerAuth((state) => state.token)

  return token ? children : <Navigate to="/officer/login" replace />
}

export default ProtectedOfficerRoute
