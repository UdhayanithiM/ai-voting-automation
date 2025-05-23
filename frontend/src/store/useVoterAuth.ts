import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Voter {
  id: string;
  phone: string;
  fullName?: string;
}

interface VoterAuthState {
  token: string | null;
  voter: Voter | null;
  otpToken: string | null;
  votingToken: string | null;

  login: (loginToken: string, voterData: Voter) => void;
  logout: () => void;

  setOtpToken: (newOtpToken: string | null) => void;
  setVotingToken: (newVotingToken: string | null) => void;
  clearAuth: () => void;
  setVoterDetails: (voterData: Voter | null) => void;
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
          otpToken: null,
          votingToken: null,
        }),

      logout: () => {
        set({
          token: null,
          voter: null,
          otpToken: null,
          votingToken: null,
        });
        localStorage.removeItem('voter-auth');
      },

      setVoterDetails: (voterData) => set({ voter: voterData }),

      setOtpToken: (newOtpToken) =>
        set((state) => ({
          otpToken: newOtpToken,
          votingToken: newOtpToken ? null : state.votingToken,
          token: newOtpToken ? null : state.token,
        })),

      setVotingToken: (newVotingToken) =>
        set({
          votingToken: newVotingToken,
          otpToken: null,
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
