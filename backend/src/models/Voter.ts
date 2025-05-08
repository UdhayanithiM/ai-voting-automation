import mongoose, { Document, Schema } from 'mongoose'

export interface VoterDocument extends Document {
  fullName: string
  voterId: string
  dob: string
  selfie?: string
}

const voterSchema = new Schema<VoterDocument>(
  {
    fullName: { type: String, required: true },
    voterId: { type: String, required: true, unique: true },
    dob: { type: String, required: true },
    selfie: { type: String },
  },
  { timestamps: true }
)

export const Voter = mongoose.model<VoterDocument>('Voter', voterSchema)
