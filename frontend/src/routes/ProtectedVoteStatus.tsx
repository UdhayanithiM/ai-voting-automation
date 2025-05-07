import { Navigate } from 'react-router-dom'
import type { JSX } from 'react'
import { useVoterStore } from '@/store/useVoteStore'
 // Adjust the path as needed

export function ProtectedVoteStatus({ children }: { children: JSX.Element }) {
    const { hasVoted } = useVoterStore()
    return hasVoted ? children : <Navigate to="/login" replace />
  }
  