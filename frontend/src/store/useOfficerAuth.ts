// frontend/src/store/useOfficerAuth.ts
import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';

// --- Type Definitions ---
interface OfficerData {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface PersistedOfficerState {
  token: string | null;
  officer: OfficerData | null;
}

export interface FullOfficerAuthState extends PersistedOfficerState {
  _hasHydrated: boolean;
  login: (token: string, officerData: OfficerData) => void;
  logout: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

// --- Initial State ---
const initialAuthState: Omit<FullOfficerAuthState, 'login' | 'logout' | 'setHasHydrated'> = {
  token: null,
  officer: null,
  _hasHydrated: false, 
};

// --- Store Creator Function ---
const officerAuthStoreLogic: StateCreator<FullOfficerAuthState, [], [], FullOfficerAuthState> = (set, get) => ({
  ...initialAuthState,

  login: (token, officerData) => {
    const officerEmailForLog = officerData?.email || 'N/A';
    console.log(`[useOfficerAuth] LOGIN action. Incoming Token: ${token ? 'PRESENT' : 'NULL'}. Officer Email: ${officerEmailForLog}`);
    set({
      token,
      officer: officerData,
    });
    const currentState = get();
    console.log(`[useOfficerAuth] State immediately AFTER login set(). Store Token: ${currentState.token ? 'PRESENT' : 'NULL'}, Hydrated: ${currentState._hasHydrated}`);
  },

  logout: () => {
    console.log('[useOfficerAuth] LOGOUT action.');
    set({
      token: null,
      officer: null,
    });
  },
  
  setHasHydrated: (hydrated) => {
    console.log(`[useOfficerAuth] ACTION: setHasHydrated called with: ${hydrated}`);
    set({ _hasHydrated: hydrated });
  }
});

// --- Persist Middleware Configuration ---
const officerPersistOptions: PersistOptions<FullOfficerAuthState, PersistedOfficerState> = {
  name: 'officer-auth-storage', 
  storage: createJSONStorage(() => localStorage),
  
  partialize: (state) => ({
    token: state.token,
    officer: state.officer,
  }),

  onRehydrateStorage: () => {
    console.log('[useOfficerAuth] onRehydrateStorage (outer setup) for persist middleware called.');
    return (rehydratedState, error) => {
      if (error) {
        console.error('[useOfficerAuth] onRehydrateStorage (inner listener): Error during rehydration:', error);
      } else {
        console.log('[useOfficerAuth] onRehydrateStorage (inner listener): Rehydration successful or storage was empty.');
        if (rehydratedState) {
             console.log(`[useOfficerAuth] onRehydrateStorage (inner listener): Token from localStorage after rehydration: ${rehydratedState.token ? 'PRESENT' : 'NULL'}`);
        }
      }
      setTimeout(() => {
        console.log('[useOfficerAuth] onRehydrateStorage (inner listener - setTimeout): Attempting to call setHasHydrated(true).');
        if (useOfficerAuth && typeof useOfficerAuth.getState === 'function') {
            useOfficerAuth.getState().setHasHydrated(true);
        } else {
            console.error('[useOfficerAuth] onRehydrateStorage (inner listener - setTimeout): useOfficerAuth.getState is not available yet.');
        }
      }, 0);
    };
  },
};

// --- Create the Store ---
export const useOfficerAuth = create<FullOfficerAuthState>()(
  persist(officerAuthStoreLogic, officerPersistOptions)
);

// --- Selector Hooks ---
export const useOfficerAuthStatus = () => {
  const { token, _hasHydrated, officer } = useOfficerAuth(
    (state) => {
      return {
        token: state.token,
        _hasHydrated: state._hasHydrated,
        officer: state.officer,
      };
    }
  );
  const isAuthenticated = !!token;
  return { 
    isAuthenticated,
    hasHydrated: _hasHydrated, 
    token,
    officer 
  };
};