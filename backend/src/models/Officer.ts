// backend/src/models/Officer.ts
import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface OfficerDocument extends Document {
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId; 
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const OfficerSchema = new Schema<OfficerDocument>(
  {
    name: { 
      type: String, 
      required: [true, 'Officer name is required']
    },
    email: { 
      type: String, 
      required: [true, 'Officer email is required'],
      unique: true,
      lowercase: true, // ✅ Ensures email is always converted to lowercase before saving
      trim: true,      // ✅ Removes whitespace from both ends of an email
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    password: { 
      type: String, 
      required: [true, 'Officer password is required'],
      select: false    // ✅ Password hash will not be returned by default in queries
    }, 
  },
  { timestamps: true }
);

// Hash password before saving a new officer document or when password is modified
OfficerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10); // Standard salt rounds
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    if (error instanceof Error) {
        return next(error);
    }
    return next(new Error('Password hashing failed during officer save.'));
  }
});

// Method to compare candidate password with the stored hashed password
OfficerSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!candidatePassword || !this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

export const Officer = mongoose.model<OfficerDocument>('Officer', OfficerSchema);