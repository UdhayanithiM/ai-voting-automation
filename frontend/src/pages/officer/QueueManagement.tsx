import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { useQueueStore } from '@/store/useQueueStore'
import API from '@/lib/axios'

interface QueueToken {
  _id: string
  tokenNumber: number
  voterName: string
  status: 'waiting' | 'completed'
}

const fetcher = (url: string) => API.get(url).then((res) => res.data)

const isArray = (data: any): data is QueueToken[] => Array.isArray(data)

export default function QueueManagement() {
  const navigate = useNavigate()
  const { setSelectedToken } = useQueueStore()

  const { data: waitingTokens, mutate: refreshWaiting } = useSWR('/queue?status=waiting', fetcher, {
    refreshInterval: 5000,
  })

  const { data: completedTokens, mutate: refreshCompleted } = useSWR(
    '/queue?status=completed',
    fetcher
  )

  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleComplete = async (id: string) => {
    try {
      setLoadingId(id)
      await API.patch(`/queue/${id}/complete`)
      refreshWaiting()
      refreshCompleted()
    } catch (error) {
      console.error(error)
      alert('Error completing token')
    } finally {
      setLoadingId(null)
    }
  }

  const handleClearQueue = async () => {
    const confirmClear = window.confirm('Are you sure you want to clear the entire queue?')
    if (!confirmClear) return

    try {
      await API.delete('/queue/reset')
      refreshWaiting()
      refreshCompleted()
      alert('✅ Queue successfully cleared')
    } catch (error) {
      console.error(error)
      alert('❌ Failed to clear queue.')
    }
  }

  const handleVerifyClick = (token: QueueToken) => {
    setSelectedToken(token)
    navigate('/officer/verify')
  }

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000')
    socket.on('queue:update', () => {
      refreshWaiting()
      refreshCompleted()
    })
    return () => {
      socket.disconnect()
    }
  }, [refreshWaiting, refreshCompleted])

  return (
    <div className="min-h-screen p-6 bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Queue Management</h1>

      <div className="flex justify-end mb-4">
        <Button onClick={handleClearQueue} className="bg-red-600 hover:bg-red-700">
          Clear All Queue
        </Button>
      </div>

      {/* Waiting Tokens */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">⏳ Waiting Voters</h2>
        {!isArray(waitingTokens) ? (
          <p className="text-gray-500">Loading queue or failed to load.</p>
        ) : waitingTokens.length === 0 ? (
          <p className="text-gray-500">No voters in queue.</p>
        ) : (
          <div className="space-y-4">
            {waitingTokens.map((token) => (
              <div
                key={token._id}
                className="flex justify-between items-center border p-4 rounded-xl"
              >
                <div>
                  <p className="text-lg font-semibold">
                    Token #{token.tokenNumber} — {token.voterName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleVerifyClick(token)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Verify
                  </Button>
                  <Button
                    onClick={() => handleComplete(token._id)}
                    disabled={loadingId === token._id}
                  >
                    {loadingId === token._id ? 'Completing...' : 'Mark as Done'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Tokens */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">✅ Completed Voters</h2>
        {!isArray(completedTokens) ? (
          <p className="text-gray-500">Loading completed tokens...</p>
        ) : completedTokens.length === 0 ? (
          <p className="text-gray-500">No completed tokens yet.</p>
        ) : (
          <div className="space-y-2 text-sm text-gray-600">
            {completedTokens.map((token) => (
              <div key={token._id} className="border px-4 py-2 rounded-md">
                Token #{token.tokenNumber} — {token.voterName}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
