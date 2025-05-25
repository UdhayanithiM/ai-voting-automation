// backend/src/models/Voter.ts
// import { Schema, model, Document, HookNextFunction } from 'mongoose'; // Original
import { Schema, model, Document, Error } from 'mongoose'; // Import Error for hook
// Or if your mongoose version has it: import { HookNextFunction } from 'mongoose';

export interface VoterDocument extends Document {
  fullName: string;
  dob: string; 
  address: string;
  photoUrl?: string;
  aadharNumber?: string;
  voterIdNumber?: string;
  registerNumber?: string;
  phoneNumber: string; 
  hasVoted: boolean;
  approved: boolean;
  status: 'Pending' | 'Verified' | 'Flagged';
  flagged: boolean;
  flagReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
  _id: string; 
}

const voterSchema = new Schema<VoterDocument>(
  {
    fullName: { type: String, required: [true, 'Full name is required.'] },
    dob: { type: String, required: [true, 'Date of birth is required.'] },
    address: { type: String, required: [true, 'Address is required.'] },
    photoUrl: { type: String, default: '' },
    aadharNumber: { type: String, unique: true, sparse: true, index: true },
    voterIdNumber: { type: String, unique: true, sparse: true, index: true },
    registerNumber: { type: String, index: true },
    phoneNumber: { type: String, required: [true, 'Phone number is required for OTP.'] },
    hasVoted: { type: Boolean, default: false, required: true },
    approved: { type: Boolean, default: false },
    status: { type: String, enum: ['Pending', 'Verified', 'Flagged'], default: 'Pending' },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String, default: '' },
  },
  { timestamps: true }
);

// Corrected type for 'next' in Mongoose pre-save hook
voterSchema.pre<VoterDocument>('save', function(next: (err?: Error) => void) { 
  if (this.isModified('aadharNumber') && this.aadharNumber) {
    this.aadharNumber = this.aadharNumber.trim();
  }
  if (this.isModified('voterIdNumber') && this.voterIdNumber) {
    this.voterIdNumber = this.voterIdNumber.trim();
  }
  if (this.isModified('registerNumber') && this.registerNumber) {
    this.registerNumber = this.registerNumber.trim();
  }
  next();
});

export const Voter = model<VoterDocument>('Voter', voterSchema);