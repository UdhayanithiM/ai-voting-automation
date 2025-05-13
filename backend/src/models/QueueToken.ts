// backend/src/models/QueueToken.ts
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface QueueTokenDocument extends Document {
  tokenNumber: number;
  voterName: string; 
  voterId?: Types.ObjectId; // Reference to the actual Voter document
  status: 'waiting' | 'processing' | 'completed';
  allottedTime?: Date;    // For the allotted slot time
  boothNumber?: string;   // Optional: if you plan for multiple booths
  createdAt?: Date;
  updatedAt?: Date;
}

const queueTokenSchema = new Schema<QueueTokenDocument>(
  {
    tokenNumber: { type: Number, required: true, index: true },
    voterName: { type: String, required: true },
    voterId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Voter', 
    }, 
    status: {
      type: String,
      enum: ['waiting', 'processing', 'completed'],
      default: 'waiting',
      index: true,
    },
    allottedTime: { type: Date },
    boothNumber: { type: String }, // Added as optional
  },
  { timestamps: true }
);

export const QueueToken = mongoose.model<QueueTokenDocument>('QueueToken', queueTokenSchema);
