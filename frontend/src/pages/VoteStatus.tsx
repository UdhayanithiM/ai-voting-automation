import { useVoterStore } from '@/store/useVoteStore'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function VoteStatus() {
  const navigate = useNavigate()
  const { selectedParty, setVoter, resetAll } = useVoterStore()

  const handleExit = () => {
    // Reset all voter info & vote state
    setVoter({
      fullName: '',
      voterId: '',
      dob: '',
      selfie: undefined,
    })
    resetAll()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-green-700">Vote Submitted!</h1>

      <div className="bg-gray-100 p-6 rounded-xl shadow text-center space-y-2">
        <p className="text-lg text-gray-700">You successfully voted for:</p>
        <p className="text-2xl font-bold text-blue-700">{selectedParty}</p>
      </div>

      <div className="flex gap-4 pt-4">
        <Button onClick={() => navigate('/feedback')}>Give Feedback</Button>
        <Button onClick={handleExit} className="bg-red-100 text-red-600 hover:bg-red-200">
          Exit
        </Button>
      </div>
    </div>
  )
}
