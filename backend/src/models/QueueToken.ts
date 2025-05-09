import mongoose, { Document, Schema } from 'mongoose'

export interface QueueTokenDocument extends Document {
  tokenNumber: number
  voterName: string
  status: 'waiting' | 'completed'
}

const queueTokenSchema = new Schema<QueueTokenDocument>(
  {
    tokenNumber: { type: Number, required: true },
    voterName: { type: String, required: true },
    status: {
      type: String,
      enum: ['waiting', 'completed'],
      default: 'waiting',
    },
  },
  { timestamps: true }
)

export const QueueToken = mongoose.model<QueueTokenDocument>('QueueToken', queueTokenSchema)
