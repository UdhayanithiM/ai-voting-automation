// backend/src/scripts/seedCandidates.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Candidate } from '../src/models/Candidate'; // Adjust path as needed

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sampleCandidates = [
  {
    name: 'Aarav Sharma',
    party: 'Progressive Alliance Party',
    position: 'Student Council President',
    symbolUrl: 'https://via.placeholder.com/50/FF0000/FFFFFF?Text=PPA', // Red placeholder
  },
  {
    name: 'Bhavna Patel',
    party: 'United Student Front',
    position: 'Student Council President',
    symbolUrl: 'https://via.placeholder.com/50/0000FF/FFFFFF?Text=USF', // Blue placeholder
  },
  {
    name: 'Chetan Reddy',
    party: 'Independent Voice',
    position: 'Student Council President',
    symbolUrl: 'https://via.placeholder.com/50/00FF00/FFFFFF?Text=IV', // Green placeholder
  },
  {
    name: 'Diya Singh',
    party: 'Future Leaders Group',
    position: 'Student Council Treasurer',
    symbolUrl: 'https://via.placeholder.com/50/FFFF00/000000?Text=FLG', // Yellow placeholder
  },
   {
    name: 'Eshan Verma',
    party: 'Student Action Now',
    position: 'Student Council Treasurer',
    symbolUrl: 'https://via.placeholder.com/50/800080/FFFFFF?Text=SAN', // Purple placeholder
  }
];

async function seedCandidates() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI not found in .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected for candidate seeding.');

    // Optional: Clear existing candidates
    // await Candidate.deleteMany({});
    // console.log('🗑️ Cleared existing candidates.');

    console.log('🌱 Seeding candidates...');
    // Use updateOne with upsert to avoid duplicates if script is run multiple times,
    // based on a unique field like 'name' (and 'position' or 'electionId' if applicable).
    // For simplicity, if you clear first, insertMany is fine.
    // If not clearing, a more robust upsert logic would be needed.
    
    // Simple insertMany, assuming you clear or manage duplicates manually for now
    await Candidate.insertMany(sampleCandidates);
    
    // More robust way to avoid duplicates if not clearing (example for name uniqueness):
    // for (const cand of sampleCandidates) {
    //   await Candidate.findOneAndUpdate({ name: cand.name, position: cand.position }, cand, { upsert: true, new: true, setDefaultsOnInsert: true });
    // }

    console.log(`✅ Successfully seeded ${sampleCandidates.length} candidates.`);
  } catch (error) {
    console.error('❌ Error seeding candidates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔒 MongoDB disconnected after candidate seeding.');
    process.exit(0);
  }
}

seedCandidates();
