import { useVoterStore } from '@/store/useVoteStore'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'

export default function Confirmation() {
  const { voter } = useVoterStore()
  const { fullName, voterId, dob, selfie } = voter
  const navigate = useNavigate()

  const handleContinueToVote = () => {
    navigate('/vote')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 space-y-6">
      <h1 className="text-2xl font-bold text-green-700">Confirmation</h1>

      <div className="space-y-2 text-center">
        <p><strong>Name:</strong> {fullName}</p>
        <p><strong>Voter ID:</strong> {voterId}</p>
        <p><strong>DOB:</strong> {dob}</p>
      </div>

      {selfie && (
        <img
          src={selfie}
          alt="Selfie"
          className="w-32 h-32 rounded-full object-cover border"
        />
      )}

      <Button onClick={handleContinueToVote}>
        Continue to Voting
      </Button>
    </div>
  )
}