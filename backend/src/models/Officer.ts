// server/models/Officer.ts
import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface OfficerDocument extends Document {
  email: string;
  password: string; // This will store the hashed password
  name: string;
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId; // Correct
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const OfficerSchema = new Schema<OfficerDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Will store the hash
  },
  { timestamps: true }
);

// Hash password before saving
OfficerSchema.pre('save', async function (next) {
  // Check if the document is new or password has been modified
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    // Handle error if bcrypt fails, ensure 'error' is typed or cast to Error
    next(error as Error);
  }
});

// Method to compare candidate password with the hashed password
OfficerSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const Officer = mongoose.model<OfficerDocument>('Officer', OfficerSchema);