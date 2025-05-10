import mongoose, { Document, Schema, Types } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface OfficerDocument extends Document {
  email: string
  password: string
  name: string
  createdAt: Date
  updatedAt: Date
  _id: Types.ObjectId // Use correct type for _id
  comparePassword(candidatePassword: string): Promise<boolean>
}

const OfficerSchema = new Schema<OfficerDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
)

OfficerSchema.pre('save', async function (next) {
  const officer = this as OfficerDocument

  if (!officer.isModified('password')) return next()

  const salt = await bcrypt.genSalt(10)
  officer.password = await bcrypt.hash(officer.password, salt)
  next()
})

OfficerSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

export const Officer = mongoose.model<OfficerDocument>('Officer', OfficerSchema)