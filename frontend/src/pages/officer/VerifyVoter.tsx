import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueueStore } from '@/store/useQueueStore'
import { Button } from '@/components/ui/Button'

export default function VerifyVoter() {
  const { selectedToken, clearToken } = useQueueStore()
  const navigate = useNavigate()

  const [status, setStatus] = useState<'scanning' | 'matched' | 'failed'>('scanning')

  useEffect(() => {
    if (!selectedToken) return
    // Simulate face scanning delay
    const timeout = setTimeout(() => {
      setStatus('matched') // Set to 'failed' to simulate failure
    }, 2000)
    return () => clearTimeout(timeout)
  }, [selectedToken])

  const handleConfirm = () => {
    clearToken()
    navigate('/officer/dashboard')
  }

  const handleBack = () => {
    clearToken()
    navigate('/officer/queue')
  }

  if (!selectedToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
        <p className="text-center text-red-500 text-lg font-semibold">
          ❌ No voter selected
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Voter Verification</h1>

      <div className="w-full max-w-md bg-gray-50 p-6 rounded-xl shadow space-y-6">
        <div>
          <p className="text-gray-700">
            <strong>Token:</strong> #{selectedToken.tokenNumber}
          </p>
          <p className="text-gray-700">
            <strong>Name:</strong> {selectedToken.voterName}
          </p>
        </div>

        <div className="h-64 w-full bg-gray-200 flex items-center justify-center rounded-xl overflow-hidden">
          {selectedToken.selfie ? (
            <img
              src={selectedToken.selfie}
              alt="Voter Selfie"
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-gray-500">No selfie available</span>
          )}
        </div>

        {status === 'scanning' ? (
          <p className="text-blue-500 font-medium text-center">🔍 Scanning face...</p>
        ) : status === 'matched' ? (
          <div className="text-center space-y-3">
            <p className="text-green-600 font-semibold">✅ Face matched successfully</p>
            <Button className="w-full" onClick={handleConfirm}>
              Verify & Continue
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <p className="text-red-600 font-semibold">❌ Face match failed</p>
            <Button className="w-full" onClick={handleBack}>
              Back to Queue
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
