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

// Full state includes non-persisted _hasHydrated and actions
export interface FullOfficerAuthState extends PersistedOfficerState {
  _hasHydrated: boolean; // Tracks if the store has been rehydrated from localStorage
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
    // Note: Do not reset _hasHydrated on logout. It indicates localStorage sync status.
  },
  
  setHasHydrated: (hydrated) => {
    // Only set if it's changing, to potentially avoid extra notifications if already set.
    if (get()._hasHydrated !== hydrated) {
        console.log(`[useOfficerAuth] ACTION: setHasHydrated called with: ${hydrated}`);
        set({ _hasHydrated: hydrated });
    } else {
        console.log(`[useOfficerAuth] ACTION: setHasHydrated called with: ${hydrated}, but already in that state.`);
    }
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
      // Set _hasHydrated to true once rehydration attempt is complete (success or failure).
      // Use a timeout to ensure this runs after the initial store setup.
      setTimeout(() => {
        if (useOfficerAuth && typeof useOfficerAuth.getState === 'function') {
            // Check current state before setting to avoid unnecessary update if already true.
            if (!useOfficerAuth.getState()._hasHydrated) {
                useOfficerAuth.getState().setHasHydrated(true);
            } else {
                console.log('[useOfficerAuth] onRehydrateStorage: Store was already marked as hydrated.');
            }
        } else {
            console.error('[useOfficerAuth] onRehydrateStorage (setTimeout): useOfficerAuth.getState is not available.');
        }
      }, 0);
    };
  },
  // Consider adding skipHydration option if manual hydration control is needed.
  // skipHydration: true, // If you want to manually trigger rehydration.
};

// --- Create the Store ---
export const useOfficerAuth = create<FullOfficerAuthState>()(
  persist(officerAuthStoreLogic, officerPersistOptions)
);

// --- More Granular Selector Hooks (Replaces useOfficerAuthStatus) ---
export const useIsOfficerAuthenticated = () => useOfficerAuth((state) => !!state.token);
export const useOfficerHasHydrated = () => useOfficerAuth((state) => state._hasHydrated);
export const useOfficerToken = () => useOfficerAuth((state) => state.token);
export const useOfficerUser = () => useOfficerAuth((state) => state.officer);

// Optional: If you still need a combined hook, ensure components using it are memoized or handle re-renders carefully.
// For example, if OfficerDashboard and ProtectedOfficerRoute use these granular hooks, 
// the old useOfficerAuthStatus hook may no longer be needed or can be refactored.

// Old hook (can be removed or refactored if components switch to granular hooks):
/*
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
*/