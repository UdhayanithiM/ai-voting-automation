// src/pages/PreviewDetails.tsx
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useVoterStore } from '@/store/useVoteStore'

export default function PreviewDetails() {
  const navigate = useNavigate()
  const voter = useVoterStore((state) => state.voter) // Access the voter from Zustand store

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-4">
      <div className="max-w-md w-full mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center text-gray-800">
          Confirm Your Details
        </h1>

        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <p className="font-medium text-gray-600">Full Name</p>
            <p className="border rounded-md px-4 py-2">{voter.fullName || '—'}</p>
          </div>

          <div>
            <p className="font-medium text-gray-600">Voter ID</p>
            <p className="border rounded-md px-4 py-2">{voter.voterId || '—'}</p>
          </div>

          <div>
            <p className="font-medium text-gray-600">Date of Birth</p>
            <p className="border rounded-md px-4 py-2">{voter.dob || '—'}</p>
          </div>
        </div>

        <Button onClick={() => navigate('/selfie-capture')}>Confirm & Continue</Button>
      </div>
    </div>
  )
}
