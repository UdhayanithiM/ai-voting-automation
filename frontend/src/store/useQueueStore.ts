import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TokenVoter {
  token: number
  name: string
  selfie: string
}

interface QueueState {
  currentToken: number
  nextToken: number
  totalWaiting: number
  queue: TokenVoter[]
  callNext: () => void
  resetQueue: () => void
}

export const useQueueStore = create<QueueState>()(
  persist(
    (set) => ({
      currentToken: 1001,
      nextToken: 1002,
      totalWaiting: 3,
      queue: [
        {
          token: 1001,
          name: 'Ravi Kumar',
          selfie: 'https://via.placeholder.com/80',
        },
        {
          token: 1002,
          name: 'Sita Devi',
          selfie: 'https://via.placeholder.com/80',
        },
        {
          token: 1003,
          name: 'Mohammed Ali',
          selfie: 'https://via.placeholder.com/80',
        },
      ],

      callNext: () =>
        set((state) => {
          const remainingQueue = state.queue.slice(1)
          return {
            currentToken: state.nextToken,
            nextToken: state.nextToken + 1,
            totalWaiting: Math.max(state.totalWaiting - 1, 0),
            queue: remainingQueue,
          }
        }),

      resetQueue: () =>
        set({
          currentToken: 1001,
          nextToken: 1002,
          totalWaiting: 3,
          queue: [
            {
              token: 1001,
              name: 'Ravi Kumar',
              selfie: 'https://via.placeholder.com/80',
            },
            {
              token: 1002,
              name: 'Sita Devi',
              selfie: 'https://via.placeholder.com/80',
            },
            {
              token: 1003,
              name: 'Mohammed Ali',
              selfie: 'https://via.placeholder.com/80',
            },
          ],
        }),
    }),
    {
      name: 'queue-storage', // localStorage key for persistence
    }
  )
)
