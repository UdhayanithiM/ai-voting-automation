// backend/src/models/Voter.ts
import { Schema, model, Document } from 'mongoose';

export interface VoterDocument extends Document {
  fullName: string;
  dob: string; 
  address: string;
  photoUrl?: string;
  
  // --- Identifier Fields ---
  aadharNumber?: string; // Now optional at the schema level
  voterIdNumber?: string;  // NEW: For Voter ID - also optional
  registerNumber?: string; // For other contexts like College ID - also optional

  phoneNumber: string; 
  hasVoted: boolean;
  
  createdAt?: Date;
  updatedAt?: Date;
  _id: string; 
}

const voterSchema = new Schema<VoterDocument>(
  {
    fullName: { 
        type: String, 
        required: [true, 'Full name is required.']
    },
    dob: { 
        type: String, 
        required: [true, 'Date of birth is required.']
    },
    address: { 
        type: String, 
        required: [true, 'Address is required.'] 
    },
    photoUrl: { 
        type: String, 
        default: '' 
    },
    aadharNumber: { 
        type: String, 
        // required: false, // No longer universally required, context will determine
        unique: true,    // Still needs to be unique if present
        sparse: true,    // IMPORTANT: Allows multiple documents to have null/missing aadharNumber
                         // without violating the unique constraint. Only non-null values are unique.
        index: true      
    },
    voterIdNumber: {     // NEW FIELD
        type: String,
        // required: false,
        unique: true,
        sparse: true,    // Same reasoning as aadharNumber
        index: true
    },
    registerNumber: { 
        type: String, 
        // required: false, // No longer universally required
        // unique: true,   // Make unique if a register number should be globally unique
        // sparse: true,   // Add if making it unique
        index: true      
    },
    phoneNumber: { 
        type: String, 
        required: [true, 'Phone number is required for OTP.'],
    },
    hasVoted: { 
        type: Boolean, 
        default: false, 
        required: true 
    },
  },
  { 
    timestamps: true 
  }
);

// Add a compound index if you want to ensure that for a specific type of election context, 
// the combination of (say) election_id and aadharNumber is unique, 
// or election_id and voterIdNumber is unique.
// For now, individual uniqueness with sparse should cover many cases.

// Consider a pre-save hook to ensure at least one required identifier is present based on context,
// or handle this validation at the controller level during voter registration/import.
// For example:
voterSchema.pre('save', function(next) {
  const voter = this as VoterDocument;
  // Example validation: For MVP, we might rely on controller logic or data seeding script.
  // For a more robust model, you could add context-specific validation here,
  // but it can get complex if context isn't stored directly on the voter model.
  // For now, let's assume the seeding script and controllers will ensure valid data.
  
  // Ensure that if aadharNumber is provided, it's trimmed (example of a simple hook)
  if (voter.isModified('aadharNumber') && voter.aadharNumber) {
    voter.aadharNumber = voter.aadharNumber.trim();
  }
  if (voter.isModified('voterIdNumber') && voter.voterIdNumber) {
    voter.voterIdNumber = voter.voterIdNumber.trim();
  }
  // Add similar for registerNumber if desired
  next();
});


export const Voter = model<VoterDocument>('Voter', voterSchema);