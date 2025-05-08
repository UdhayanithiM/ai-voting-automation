import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function Feedback() {
  const [feedback, setFeedback] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Thank you for your feedback!')
    setFeedback('')
    navigate('/') // Back to welcome screen
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Thank You for Voting!</h1>
        <p className="text-gray-600">We’d love to hear your feedback.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Type your feedback here..."
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            rows={5}
          />
          <Button type="submit" className="w-full">
            Submit & Finish
          </Button>
        </form>
      </div>
    </div>
  )
}
