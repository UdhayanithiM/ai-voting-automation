import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useBoothStore } from '@/store/useBoothStore'

export default function BoothVerification() {
  const navigate = useNavigate()
  const { scannedVoter, clearScan } = useBoothStore()

  // Show fallback if no voter is scanned
  if (!scannedVoter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 bg-white px-6">
        <p className="text-lg">No voter scanned yet.</p>
        <Button onClick={() => navigate('/officer/dashboard')} className="mt-6">
          Back to Dashboard
        </Button>
      </div>
    )
  }

  const handleApprove = () => {
    alert(`✅ Voter ${scannedVoter.fullName} has been successfully verified.`)
    clearScan()
    navigate('/officer/dashboard')
  }

  const handleReject = () => {
    alert(`❌ Voter ${scannedVoter.fullName} verification failed.`)
    clearScan()
    navigate('/officer/dashboard') // Redirecting to dashboard after rejection
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-white space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 text-center">Booth Verification</h1>

      <div className="space-y-4 text-center">
        {/* Voter Info */}
        <div>
          <p className="text-sm text-gray-500 mb-1">Voter ID</p>
          <p className="text-lg font-medium text-gray-700">{scannedVoter.voterId}</p>
        </div>

        {/* Selfie Preview */}
        <div>
          <p className="text-sm text-gray-500 mb-1">Live Selfie Preview</p>
          <img
            src={scannedVoter.selfie || 'https://via.placeholder.com/80'}
            alt="Selfie"
            className="w-32 h-32 rounded-full object-cover border mx-auto"
          />
        </div>

        {/* Matched Record */}
        <div>
          <p className="text-sm text-gray-500 mb-1">Matched Record</p>
          <div className="border p-4 rounded bg-gray-50 text-left space-y-1">
            <p><strong>Name:</strong> {scannedVoter.fullName}</p>
            <p><strong>DOB:</strong> {scannedVoter.dob}</p>
            <p><strong>Status:</strong> {scannedVoter.status}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 pt-4">
        <Button onClick={handleApprove} className="bg-green-500 text-white hover:bg-green-600">
          Approve
        </Button>
        <Button
          onClick={handleReject}
          className="bg-red-100 text-red-600 hover:bg-red-200"
        >
          Reject
        </Button>
      </div>
    </div>
  )
}
