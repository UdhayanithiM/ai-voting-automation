// src/pages/officer/ProtectedOfficerRoute.tsx

import { Navigate } from 'react-router-dom'
import { useOfficerAuth } from '@/store/useOfficerAuth'
import type { JSX } from 'react'

type ProtectedRouteProps = {
  children: JSX.Element
}

export default function ProtectedOfficerRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useOfficerAuth()

  return isAuthenticated ? children : <Navigate to="/officer/login" replace />
}
