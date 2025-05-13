// backend/src/models/Voter.ts
import { Schema, model, Document } from 'mongoose';

// Define the interface for the Voter document
export interface VoterDocument extends Document {
  fullName: string;         // Corresponds to 'name' in your basic idea
  dob: string;              // Date of Birth (consider storing as Date type if complex queries needed)
  address: string;          // New field from your basic idea
  photoUrl?: string;        // URL or path to the stored ID proof photo (your 'photo')
  aadharNumber: string;    // New field (your 'aadharNumber'), will be a primary identifier
  registerNumber: string;   // New field (your 'voterNumber' / college register no), another identifier
  phoneNumber: string;      // New field, must be pre-registered for sending OTP
  hasVoted: boolean;        // New field to track if the vote has been cast
  // Removed fields like old 'voterId', 'approved', 'flagged', 'status' for MVP simplicity
  // We can add status fields back later if needed (e.g. 'PendingFaceVerification', 'VerifiedForVoting')
  createdAt?: Date;         // Automatically managed by Mongoose timestamps
  updatedAt?: Date;  
  _id: string;              // Automatically managed by Mongoose timestamps
}

// Define the Mongoose schema
const voterSchema = new Schema<VoterDocument>(
  {
    fullName: { 
        type: String, 
        required: [true, 'Full name is required.'] // Added required message
    },
    dob: { 
        type: String, 
        required: [true, 'Date of birth is required.'] // Consider validating format or using Date type
    },
    address: { 
        type: String, 
        required: [true, 'Address is required.'] 
    },
    photoUrl: { 
        type: String, 
        default: '' // Or make it required if an ID photo is mandatory for registration
    },
    aadharNumber: { 
        type: String, 
        required: [true, 'Aadhaar number is required.'], 
        unique: true, // Aadhaar should be globally unique
        index: true   // Good for query performance
    },
    registerNumber: { 
        type: String, 
        required: [true, 'Register number (college ID) is required.'],
        index: true   // Good for query performance
    },
    phoneNumber: { 
        type: String, 
        required: [true, 'Phone number is required for OTP.'],
        // Add validation for phone number format if desired
    },
    hasVoted: { 
        type: Boolean, 
        default: false, 
        required: true 
    },
  },
  { 
    timestamps: true // Automatically adds createdAt and updatedAt fields
  }
);

// Optional: If the combination of aadharNumber and registerNumber must be unique (e.g. one aadhar can have multiple regNo in diff contexts, but not here)
// voterSchema.index({ aadhaarNumber: 1, registerNumber: 1 }, { unique: true });
// However, making aadharNumber globally unique is usually sufficient.

// Export the Mongoose model
export const Voter = model<VoterDocument>('Voter', voterSchema);