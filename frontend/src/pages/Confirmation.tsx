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

  const handleGiveFeedback = () => {
    navigate('/feedback')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 space-y-6">
      <h1 className="text-2xl font-bold text-green-700">Confirmation</h1>

      <div className="space-y-2 text-center">
        <p className="text-lg font-semibold text-gray-700"><strong>Name:</strong> {fullName}</p>
        <p className="text-lg font-semibold text-gray-700"><strong>Voter ID:</strong> {voterId}</p>
        <p className="text-lg font-semibold text-gray-700"><strong>DOB:</strong> {dob}</p>
      </div>

      {/* Display Selfie if available */}
      {selfie && (
        <div className="mt-4">
          <img
            src={selfie}
            alt="Selfie"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
          />
        </div>
      )}

      <div className="mt-6 space-x-4">
        <Button onClick={handleContinueToVote} className="bg-blue-600 text-white hover:bg-blue-700">
          Continue to Voting
        </Button>
        <Button onClick={handleGiveFeedback} className="bg-green-600 text-white hover:bg-green-700">
          Give Feedback
        </Button>
      </div>
    </div>
  )
}
