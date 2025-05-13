// frontend/src/store/useOfficerAuth.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the structure of officer data returned from backend
interface OfficerData {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface OfficerAuthState {
  isAuthenticated: boolean;
  token: string | null;
  officer: OfficerData | null;
  login: (token: string, officerData: OfficerData) => void;
  logout: () => void;
}

export const useOfficerAuth = create<OfficerAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      officer: null,
      login: (token, officerData) => {
        set({
          isAuthenticated: true,
          token,
          officer: officerData,
        });
      },
      logout: () => {
        localStorage.removeItem('token'); // << ADD
        set({
          isAuthenticated: false,
          token: null,
          officer: null,
        });
      },
    }),
    {
      name: 'officer-auth-storage',
      storage: createJSONStorage(() => localStorage),

      // Update `isAuthenticated` after rehydration if token exists
      onRehydrateStorage: (persistedState) => {
        if (persistedState?.token) {
          return (rehydratedState, error): void => {
            if (error) {
              console.error('Error rehydrating officer auth state:', error);
              return;
            }
            if (rehydratedState) {
              rehydratedState.isAuthenticated = !!rehydratedState.token;
            }
          };
        }
        return undefined;
      },
    }
  )
);
