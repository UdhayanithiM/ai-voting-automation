// backend/src/models/Admin.ts
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs'; // Ensure this import

export interface AdminDocument extends Document {
  email: string;
  password: string;
  // name?: string; // Add if you have a name field
  _id: string; // Mongoose _id is usually ObjectId, but string is fine if consistently used
}

const adminSchema = new Schema<AdminDocument>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // name: { type: String }, // Add if you have a name field
  },
  { timestamps: true }
);

// Hash password before saving for Admin
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Optional: Add a comparePassword method for consistency
adminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const Admin = mongoose.model<AdminDocument>('Admin', adminSchema);