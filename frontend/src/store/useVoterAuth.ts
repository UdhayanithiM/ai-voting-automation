import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface VoterAuthState {
  token: string | null
  voter: { id: string; phone: string } | null
  login: (token: string, voter: { id: string; phone: string }) => void
  logout: () => void
}

export const useVoterAuth = create<VoterAuthState>()(
  persist(
    (set) => ({
      token: null,
      voter: null,
      login: (token, voter) => set({ token, voter }),
      logout: () => {
        localStorage.removeItem('token') // << ADDED EXACTLY AS YOU SAID
        set({ token: null, voter: null })
      },
    }),
    { name: 'voter-auth' }
  )
)
