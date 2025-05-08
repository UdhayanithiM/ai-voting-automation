import { create } from 'zustand'

interface OfficerAuthStore {
  isAuthenticated: boolean
  login: () => void
  logout: () => void
}

export const useOfficerAuth = create<OfficerAuthStore>((set) => ({
  isAuthenticated: false,
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),
}))
