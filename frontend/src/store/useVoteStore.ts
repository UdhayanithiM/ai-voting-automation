import { create } from 'zustand'

// Define VoterDetails interface
interface VoterDetails {
  fullName: string
  voterId: string
  dob: string
  selfie?: string | undefined
}

interface VoterStore {
  voter: VoterDetails
  selectedParty: string | null
  hasVoted: boolean
  setVoter: (data: VoterDetails) => void
  updateSelfie: (selfie: string) => void
  setParty: (party: string) => void
  submitVote: () => void
  resetAll: () => void
}

export const useVoterStore = create<VoterStore>((set) => ({
  voter: {
    fullName: '',
    voterId: '',
    dob: '',
    selfie: undefined,
  },
  selectedParty: null,
  hasVoted: false,
  setVoter: (data) => set({ voter: data }),
  updateSelfie: (selfie) =>
    set((state) => ({
      voter: {
        ...state.voter,
        selfie,
      },
    })),
  setParty: (party) => set({ selectedParty: party }),
  submitVote: () => set({ hasVoted: true }),
  resetAll: () =>
    set({
      voter: {
        fullName: '',
        voterId: '',
        dob: '',
        selfie: undefined,
      },
      selectedParty: null,
      hasVoted: false,
    }),
}))
