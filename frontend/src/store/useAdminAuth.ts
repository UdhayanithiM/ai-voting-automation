import { create } from 'zustand'

interface AdminAuthState {
  isAuthenticated: boolean
  login: () => void
  logout: () => void
}

export const useAdminAuth = create<AdminAuthState>((set) => ({
  isAuthenticated: false,
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),
}))
