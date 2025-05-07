// src/pages/VoterDetails.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import dayjs from 'dayjs'
import { useVoterStore } from '@/store/useVoteStore'

export default function VoterDetails() {
  const navigate = useNavigate()
  const setVoter = useVoterStore((state) => state.setVoter) // Access setVoter from Zustand store

  const [fullName, setFullName] = useState('')
  const [voterId, setVoterId] = useState('')
  const [dob, setDob] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validate = () => {
    const newErrors: typeof errors = {}

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!voterId.match(/^[a-zA-Z0-9]+$/)) {
      newErrors.voterId = 'Voter ID must be alphanumeric'
    }

    if (!dob) {
      newErrors.dob = 'Date of birth is required'
    } else {
      const age = dayjs().diff(dayjs(dob), 'year')
      if (age < 18) {
        newErrors.dob = 'Must be at least 18 years old'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      // Update voter information in Zustand store
      setVoter({ fullName, voterId, dob })
      // Navigate to the preview details page
      navigate('/preview-details')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Voter Details</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div>
          <Input
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
          )}
        </div>

        <div>
          <Input
            placeholder="Voter ID (e.g. ABC123)"
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
          />
          {errors.voterId && (
            <p className="text-red-500 text-sm mt-1">{errors.voterId}</p>
          )}
        </div>

        <div>
          <Input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
          {errors.dob && (
            <p className="text-red-500 text-sm mt-1">{errors.dob}</p>
          )}
        </div>

        <Button type="submit">Continue</Button>
      </form>
    </div>
  )
}
