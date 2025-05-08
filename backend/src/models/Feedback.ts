import mongoose, { Document, Schema } from 'mongoose'

export interface FeedbackDocument extends Document {
  voterId: string
  message: string
  createdAt?: Date
}

const feedbackSchema = new Schema<FeedbackDocument>(
  {
    voterId: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
)

export const Feedback = mongoose.model<FeedbackDocument>('Feedback', feedbackSchema)
