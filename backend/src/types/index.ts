import { Document, Types } from 'mongoose';

export interface VoterDocument extends Document {
  fullName: string;
  voterId: string;
  dob: string;
  selfie?: string;
  approved: boolean;
  flagged: boolean;
  status: 'Pending' | 'Verified' | 'Flagged';
  phone?: string;
  flagReason?: string;
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId; // Use correct type for _id
}

export interface CandidateDocument extends Document {
  name: string;
  position: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoteDocument extends Document {
  voter: Types.ObjectId | VoterDocument;
  candidate: Types.ObjectId | CandidateDocument;
  createdAt: Date;
  updatedAt: Date;
}