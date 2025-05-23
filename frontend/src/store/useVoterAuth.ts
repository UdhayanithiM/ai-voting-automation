import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Voter {
  id: string;
  phone: string;
  fullName?: string;
}

interface VoterAuthState {
  token: string | null; // For a generic, simpler voter login flow if ever implemented
  voter: Voter | null;
  otpToken: string | null; // Token after OTP verification
  votingToken: string | null; // Token after face verification, for voting

  login: (loginToken: string, voterData: Voter) => void;
  logout: () => void; // General logout, might be for the generic 'token'
  setVoterDetails: (voterData: Voter | null) => void;
  setOtpToken: (newOtpToken: string | null) => void;
  setVotingToken: (newVotingToken: string | null) => void;
  clearAuth: () => void; // Clears all voter related tokens and details
}

export const useVoterAuth = create<VoterAuthState>()(
  persist(
    (set) => ({
      token: null,
      voter: null,
      otpToken: null,
      votingToken: null,

      login: (loginToken, voterData) =>
        set({
          token: loginToken,
          voter: voterData,
          otpToken: null, // Clear other stage tokens
          votingToken: null,
        }),

      logout: () => {
        set({
          token: null,
          voter: null,
        });
      },

      setVoterDetails: (voterData) => set({ voter: voterData }),

      setOtpToken: (newOtpToken) =>
        set((state) => {
          return {
            otpToken: newOtpToken,
            votingToken: null, 
            token: newOtpToken ? null : state.token, 
          };
        }),

      // MODIFIED PART
      setVotingToken: (newVotingToken) => {
        // Step 1: Immediately set the new votingToken.
        // The component calling this will have already called navigate()
        set({ votingToken: newVotingToken });
        
        // Step 2: Schedule the clearing of the old otpToken.
        // This slight delay allows React Router to process navigation away
        // from the page that was guarded by otpToken.
        setTimeout(() => {
          set({ otpToken: null });
        }, 50); // 50ms delay (adjust if necessary, but keep it small)
      },

      // MODIFIED PART
      clearAuth: () => {
        // Schedule the clearing of all auth state to allow navigation to complete.
        // The component calling this should have already called navigate().
        setTimeout(() => {
            set({
                token: null,
                voter: null,
                otpToken: null,
                votingToken: null,
            });
        }, 50); // 50ms delay
      },
    }),
    {
      name: 'voter-auth', 
    }
  )
);