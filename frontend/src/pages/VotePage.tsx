import { useEffect } from 'react'
import { useVoterStore } from '@/store/useVoteStore'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

const dummyParties = ['Party A', 'Party B', 'Party C']

export default function VotePage() {
  const { selectedParty, setParty, submitVote, hasVoted } = useVoterStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (hasVoted) {
      alert('You have already voted.')
      navigate('/status') // redirect to thank you or status page
    }
  }, [hasVoted, navigate])

  const handleSubmit = () => {
    if (!selectedParty) {
      alert('Please select a party before submitting.')
      return
    }
    submitVote() // ✅ set hasVoted = true
    alert(`You voted for ${selectedParty}`)
    navigate('/status')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-center text-gray-800">Cast Your Vote</h1>

      <div className="w-full max-w-md space-y-4">
        {dummyParties.map((party) => (
          <div
            key={party}
            onClick={() => setParty(party)}
            className={`cursor-pointer border rounded-lg px-6 py-4 text-lg font-medium ${
              selectedParty === party
                ? 'border-blue-600 bg-blue-50 text-blue-800'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {party}
          </div>
        ))}
      </div>

      <Button className="w-full max-w-md" onClick={handleSubmit}>
        Submit Vote
      </Button>
    </div>
  )
}