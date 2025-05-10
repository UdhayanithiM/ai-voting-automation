import { create } from 'zustand'

interface OfficerState {
  isAuthenticated: boolean
  token: string | null
  officer: { id: string; email: string } | null
  login: (token: string, officer: any) => void
  logout: () => void
}

export const useOfficerAuth = create<OfficerState>((set) => ({
  isAuthenticated: false,
  token: null,
  officer: null,
  login: (token, officer) =>
    set({ isAuthenticated: true, token, officer }),
  logout: () => set({ isAuthenticated: false, token: null, officer: null }),
}))
