import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminAuthState {
  token: string | null
  admin: { id: string; email: string } | null
  login: (token: string, admin: { id: string; email: string }) => void
  logout: () => void
}

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      login: (token, admin) => set({ token, admin }),
      logout: () => {
        localStorage.removeItem('token') // << ADDED EXACTLY AS YOU SAID
        set({ token: null, admin: null })
      },
    }),
    { name: 'admin-auth' }
  )
)
