import { useQueueStore } from '@/store/useQueueStore'
import { Button } from '@/components/ui/Button'

export default function QueueDisplay() {
  const {
    currentToken,
    nextToken,
    totalWaiting,
    queue,
    callNext,
    resetQueue,
  } = useQueueStore()

  const currentVoter = queue.find((v) => v.token === currentToken)

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-10 space-y-8 text-center">
      <h1 className="text-3xl font-bold text-gray-800">Queue Management</h1>

      <div className="grid gap-4 text-lg">
        <p>
          <strong>Now Serving Token:</strong>{' '}
          <span className="text-blue-600 text-2xl">{currentToken}</span>
        </p>
        <p>
          <strong>Next Token:</strong> {nextToken}
        </p>
        <p>
          <strong>Total Waiting:</strong> {totalWaiting}
        </p>
        <p>
          <strong>Estimated Wait:</strong> {totalWaiting * 2} min
        </p>
      </div>

      {currentVoter && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">Now Serving</p>
          <img
            src={currentVoter.selfie}
            alt="Voter"
            className="w-24 h-24 rounded-full object-cover mx-auto border"
          />
          <p className="mt-2 text-lg font-semibold text-gray-800">
            {currentVoter.name}
          </p>
        </div>
      )}

      <div className="flex gap-4 pt-6">
        <Button onClick={callNext}>Call Next</Button>
        <Button
          onClick={resetQueue}
          className="bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
