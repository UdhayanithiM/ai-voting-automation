import { Schema, model } from 'mongoose';
import { VoterDocument } from '../types';

const voterSchema = new Schema<VoterDocument>(
  {
    fullName: { type: String, required: true },
    voterId: { type: String, required: true, unique: true },
    dob: { type: String, required: true },
    selfie: { type: String },
    approved: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false },
    status: { 
      type: String, 
      enum: ['Pending', 'Verified', 'Flagged'], 
      default: 'Pending' 
    },
    phone: { type: String },
    flagReason: { type: String }
  },
  { timestamps: true }
);

export const Voter = model<VoterDocument>('Voter', voterSchema);