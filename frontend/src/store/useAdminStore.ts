import { create } from 'zustand'

export interface VoterRecord {
  fullName: string
  voterId: string
  dob: string
  selfie?: string
  status: 'Pending' | 'Verified' | 'Flagged'
}

interface AdminStore {
  voters: VoterRecord[]
  selectedVoter?: VoterRecord | undefined
  approveVoter: (voterId: string) => void
  flagVoter: (voterId: string) => void
  setSelectedVoter: (voter: VoterRecord) => void
  loadDummyData: () => void
  addVoter: (voter: VoterRecord) => void // 🔥 New method
}

export const useAdminStore = create<AdminStore>((set) => ({
  voters: [],
  selectedVoter: undefined,

  approveVoter: (voterId) =>
    set((state) => ({
      voters: state.voters.map((v) =>
        v.voterId === voterId ? { ...v, status: 'Verified' } : v
      ),
    })),

  flagVoter: (voterId) =>
    set((state) => ({
      voters: state.voters.map((v) =>
        v.voterId === voterId ? { ...v, status: 'Flagged' } : v
      ),
    })),

  setSelectedVoter: (voter) => set({ selectedVoter: voter }),

  loadDummyData: () =>
    set({
      voters: [
        {
          fullName: 'John Doe',
          voterId: 'AB123456',
          dob: '2000-01-01',
          selfie: 'https://via.placeholder.com/64',
          status: 'Pending',
        },
        {
          fullName: 'Jane Smith',
          voterId: 'CD987654',
          dob: '1995-06-15',
          selfie: 'https://via.placeholder.com/64',
          status: 'Verified',
        },
      ],
    }),

  addVoter: (voter) =>
    set((state) => ({
      voters: [...state.voters, voter],
    })),
}))
