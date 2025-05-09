import { create } from 'zustand'

interface QueueToken {
  _id: string
  tokenNumber: number
  voterName: string
  status: 'waiting' | 'completed'
  selfie?: string 
}

interface QueueStore {
  selectedToken: QueueToken | null
  setSelectedToken: (token: QueueToken) => void
  clearToken: () => void
}

export const useQueueStore = create<QueueStore>((set) => ({
  selectedToken: null,
  setSelectedToken: (token) => set({ selectedToken: token }),
  clearToken: () => set({ selectedToken: null }),
}))
