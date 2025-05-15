// src/store/useVoterAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Voter {
  id: string;
  phone: string;
  // Add other relevant voter details if needed, e.g., name, aadharLast4Digits
}

interface VoterAuthState {
  token: string | null;       // Generic session token (use with caution if voter flow is distinct)
  voter: Voter | null;        // Details of the authenticated user/voter
  otpToken: string | null;    // Token received after successful OTP verification (for voter flow)
  votingToken: string | null; // Token received after successful face verification (for voter flow)

  login: (loginToken: string, voterData: Voter) => void; // Sets generic token, clears voter flow tokens
  logout: () => void;                                   // Clears all auth state

  setOtpToken: (newOtpToken: string | null) => void;      // Sets OTP token, ensures clean state for next step
  setVotingToken: (newVotingToken: string | null) => void; // Sets Voting token
  clearAuth: () => void;                                  // Clears all auth related state
  setVoterDetails: (voterData: Voter | null) => void;     // Sets voter details
}

export const useVoterAuth = create<VoterAuthState>()(
  persist(
    (set) => ({
      token: null,
      voter: null,
      otpToken: null,
      votingToken: null,

      login: (loginToken, voterData) => set({
        token: loginToken,
        voter: voterData,
        otpToken: null,     // Clear voter-flow specific tokens on a generic login
        votingToken: null,
      }),

      logout: () => {
        set({ // Directly set the initial/cleared state values
          token: null,
          voter: null,
          otpToken: null,
          votingToken: null,
        });
      },
      
      setVoterDetails: (voterData) => set({ voter: voterData }),

      setOtpToken: (newOtpToken) => set({
        otpToken: newOtpToken,
        votingToken: null, // New OTP cycle invalidates any previous voting token
        token: null,       // Clear generic token if OTP flow is a distinct session type
        // voter: null,    // Cleared or set via setVoterDetails if needed
      }),

      setVotingToken: (newVotingToken) => set({
        votingToken: newVotingToken,
        // otpToken: null, // Optionally clear otpToken after it's successfully used.
                           // Keeping it might be useful for auditing.
      }),

      clearAuth: () =>
        set({
          token: null,
          voter: null,
          otpToken: null,
          votingToken: null,
        }),
    }),
    {
      name: 'voter-auth', 
    }
  )
);