// frontend/src/store/useAdminAuth.ts
import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';

interface AdminData {
  id: string;
  email: string;
  role?: string; 
}

interface PersistedAdminState {
  token: string | null;
  admin: AdminData | null;
}

export interface FullAdminAuthState extends PersistedAdminState {
  _hasHydrated: boolean; 
  login: (token: string, adminData: AdminData) => void;
  logout: () => void;
  setHasHydrated: (hydrated: boolean) => void; 
}

const initialAdminAuthState: Omit<FullAdminAuthState, 'login' | 'logout' | 'setHasHydrated'> = {
  token: null,
  admin: null,
  _hasHydrated: false,
};

const adminAuthStoreLogic: StateCreator<FullAdminAuthState, [], [], FullAdminAuthState> = (set, get) => ({
  ...initialAdminAuthState,

  login: (token, adminData) => {
    console.log(`[useAdminAuth] LOGIN action. Admin Email: ${adminData?.email}, Role: ${adminData?.role}`);
    set({
      token,
      admin: adminData,
    });
  },

  logout: () => {
    console.log('[useAdminAuth] LOGOUT action.');
    set({
      token: null,
      admin: null,
    });
  },
  
  setHasHydrated: (hydrated) => {
    if (get()._hasHydrated !== hydrated) {
        console.log(`[useAdminAuth] ACTION: setHasHydrated called with: ${hydrated}`);
        set({ _hasHydrated: hydrated });
    }
  }
});

const adminPersistOptions: PersistOptions<FullAdminAuthState, PersistedAdminState> = {
  name: 'admin-auth-storage', 
  storage: createJSONStorage(() => localStorage),
  
  partialize: (state) => ({
    token: state.token,
    admin: state.admin,
  }),

  onRehydrateStorage: () => {
    // The first argument 'rehydratedState' can be ignored if not used.
    // The 'error' argument is the second one.
    return (_rehydratedState, error) => { // Use _rehydratedState to indicate it's intentionally unused
      if (error) {
        console.error('[useAdminAuth] onRehydrateStorage: Error during rehydration:', error);
      }
      setTimeout(() => {
        if (useAdminAuth && typeof useAdminAuth.getState === 'function' && useAdminAuth.getState().setHasHydrated) {
            useAdminAuth.getState().setHasHydrated(true);
        } else {
            console.error('[useAdminAuth] onRehydrateStorage (setTimeout): Could not set _hasHydrated.');
        }
      }, 0);
    };
  },
};

export const useAdminAuth = create<FullAdminAuthState>()(
  persist(adminAuthStoreLogic, adminPersistOptions)
);

export const useIsAdminAuthenticated = () => useAdminAuth((state) => !!state.token);
export const useAdminHasHydrated = () => useAdminAuth((state) => state._hasHydrated);
export const useAdminUser = () => useAdminAuth((state) => state.admin);