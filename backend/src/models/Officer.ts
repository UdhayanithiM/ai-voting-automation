import mongoose, { Document, Schema } from 'mongoose'

export interface OfficeDocument extends Document {
  email: string
  password: string
  _id: string
}

const OfficeSchema = new Schema<OfficeDocument>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
)

export const Officer = mongoose.model<OfficeDocument>('Office',OfficeSchema)
