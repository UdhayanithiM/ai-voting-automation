// backend/src/models/Candidate.ts
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface CandidateDocument extends Document {
  name: string; 
  party?: string; 
  symbolUrl?: string; 
  position?: string; 
  electionId?: Types.ObjectId; // Optional: For specific elections
  createdAt?: Date;
  updatedAt?: Date;
}

const candidateSchema = new Schema<CandidateDocument>(
  {
    name: { type: String, required: [true, "Candidate name is required."] },
    party: { type: String },
    symbolUrl: { type: String },
    position: { type: String }, // e.g., "Student Council President"
    electionId: { type: Schema.Types.ObjectId, ref: 'Election' }, // Link to an Election model if you plan one
  },
  { timestamps: true }
);

candidateSchema.index({ name: 1 });
candidateSchema.index({ party: 1 });
candidateSchema.index({ electionId: 1 });

export const Candidate = mongoose.model<CandidateDocument>('Candidate', candidateSchema);
