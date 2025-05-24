// frontend/src/store/useOfficerAuth.ts
import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage, StateStorage, PersistOptions, StorageValue } from 'zustand/middleware';

// --- Type Definitions ---
interface OfficerData {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

// This is the state that will be persisted to localStorage
interface PersistedOfficerState {
  token: string | null;
  officer: OfficerData | null;
}

// This is the full runtime state of the store
// We add isAuthenticated as a derived value in selectors/hooks
export interface FullOfficerAuthState extends PersistedOfficerState {
  _hasHydrated: boolean;   // Tracks if rehydration from storage is complete
  login: (token: string, officerData: OfficerData) => void;
  logout: () => void;
  // No explicit setHydrated action needed here for this approach
}

// --- Store Creator Function ---
// Removed 'get' from params as it's not used if not debugging inside actions
const officerAuthStoreLogic: StateCreator<FullOfficerAuthState, [], [], FullOfficerAuthState> = (set) => ({
  token: null,
  officer: null,
  _hasHydrated: false,   // Initial value, will be set to true by persist when done

  login: (token, officerData) => {
    // console.log('[useOfficerAuth] LOGIN action called.');
    set({
      token,
      officer: officerData,
      // isAuthenticated is effectively true now because token is set
    });
  },

  logout: () => {
    // console.log('[useOfficerAuth] LOGOUT action called.');
    set({
      token: null,
      officer: null,
      // isAuthenticated is effectively false now
    });
  },
});

// --- Persist Middleware Configuration ---
const officerPersistOptions: PersistOptions<FullOfficerAuthState, PersistedOfficerState> = {
  name: 'officer-auth-storage', 
  storage: createJSONStorage(() => localStorage), 
  
  partialize: (state) => ({
    token: state.token,
    officer: state.officer,
  }),

  // This function is called AFTER the store has been rehydrated.
  // The `state` parameter here is the full store state *after* rehydration.
  // We use it to set our _hasHydrated flag.
  onRehydrateStorage: () => {
    console.log('[useOfficerAuth] onRehydrateStorage: Initializing persist middleware.');
    return (state, error) => {
      if (error) {
        console.error('[useOfficerAuth] onRehydrateStorage callback: Error during rehydration by middleware:', error);
        // Even on error, we consider hydration attempt "finished"
        if (state) state._hasHydrated = true; 
      } else {
        // If rehydratedState is null/undefined, it means nothing was in storage.
        // If it has data, the persist middleware has already merged it into the store.
        // console.log('[useOfficerAuth] onRehydrateStorage callback: Rehydration successful or nothing in storage.');
        if (state) state._hasHydrated = true;
      }
      // console.log('[useOfficerAuth] onRehydrateStorage callback: _hasHydrated should be true now if state existed.');
    };
  },
  // version: 0, 
};

// --- Create the Store ---
export const useOfficerAuth = create<FullOfficerAuthState>()(
  persist(officerAuthStoreLogic, officerPersistOptions)
);

// --- Selector Hooks ---
export const useOfficerAuthHasHydrated = () => useOfficerAuth((state) => state._hasHydrated);

export const useOfficerAuthStatus = () => {
  const { token, _hasHydrated, officer } = useOfficerAuth(
    (state) => ({ 
      token: state.token, 
      _hasHydrated: state._hasHydrated,
      officer: state.officer,
    })
  );
  return { 
    isAuthenticated: !!token, // Derive isAuthenticated here
    hasHydrated: _hasHydrated, 
    token,
    officer 
  };
};