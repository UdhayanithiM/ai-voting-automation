import { create } from 'zustand'

interface VoterProfile {
  fullName: string
  voterId: string
  dob: string
  selfie?: string
  status: 'Pending' | 'Verified' | 'Rejected'
}

interface BoothStore {
  scannedVoter: VoterProfile | null
  scanVoter: (voter: VoterProfile) => void
  clearScan: () => void
}

export const useBoothStore = create<BoothStore>((set) => ({
  scannedVoter: null,
  scanVoter: (voter) => set({ scannedVoter: voter }),
  clearScan: () => set({ scannedVoter: null }),
}))
