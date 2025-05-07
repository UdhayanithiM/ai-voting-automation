import { Navigate } from 'react-router-dom'
import { useVoterStore } from '@/store/useVoteStore'
import type { JSX } from 'react'

export function ProtectedVoteRoute({ children }: { children: JSX.Element }) {
  const { voter } = useVoterStore()

  const isValid = voter.fullName && voter.voterId && voter.dob

  return isValid ? children : <Navigate to="/login" replace />
}
