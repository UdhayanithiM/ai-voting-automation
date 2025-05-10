import { Schema, model } from 'mongoose';
import { VoteDocument } from '../types';

const voteSchema = new Schema<VoteDocument>(
  {
    voter: { type: Schema.Types.ObjectId, ref: 'Voter', required: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true }
  },
  { timestamps: true }
);

export const Vote = model<VoteDocument>('Vote', voteSchema);