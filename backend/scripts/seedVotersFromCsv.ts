// backend/scripts/seedVotersFromCsv.ts
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Voter, VoterDocument } from '../src/models/Voter'; // Adjust path as per your structure

// Load environment variables (especially MONGO_URI)
dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Ensure .env from backend root is loaded

interface CsvRow {
  fullName: string;
  dob: string;
  address: string;
  photoUrl: string;
  aadharNumber: string;
  registerNumber: string;
  phoneNumber: string;
  // Add other columns if your CSV has more, though model only uses these for now
}

async function seedVotersFromCsv() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI not found in .env file. Make sure it is in backend/.env');
    process.exit(1);
  }

  // Path to your CSV file - place it in the 'backend/scripts' folder or adjust path
  const csvFilePath = path.resolve(__dirname, 'voter_data.csv'); 

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found at: ${csvFilePath}`);
    console.log('Please create a voter_data.csv file in the backend/scripts/ directory with columns:');
    console.log('fullName,dob,address,photoUrl,aadharNumber,registerNumber,phoneNumber');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected for seeding.');

    // Optional: Clear existing voters before seeding to prevent duplicates on re-runs
    // Be careful with this in a non-development environment!
    const shouldClearCollection = process.argv.includes('--clear'); // Pass --clear argument to script if you want to clear
    if (shouldClearCollection) {
        console.log('🗑️ Clearing existing voters from the collection...');
        await Voter.deleteMany({});
        console.log('✅ Voters collection cleared.');
    }


    const votersToSeed: VoterDocument[] = [];
    let rowCount = 0;
    let importedCount = 0;
    let skippedCount = 0;

    console.log(`📄 Reading data from ${csvFilePath}...`);

    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (row: CsvRow) => {
        rowCount++;
        // Basic validation for required fields from CSV
        if (!row.fullName || !row.dob || !row.address || !row.aadharNumber || !row.registerNumber || !row.phoneNumber) {
            console.warn(`⚠️ Skipping row ${rowCount}: Missing one or more required fields (fullName, dob, address, aadharNumber, registerNumber, phoneNumber). Data:`, row);
            skippedCount++;
            return;
        }

        const voterData = {
          fullName: row.fullName.trim(),
          dob: row.dob.trim(),
          address: row.address.trim(),
          photoUrl: row.photoUrl ? row.photoUrl.trim() : undefined, // Handle optional photoUrl
          aadharNumber: row.aadharNumber.trim(),
          registerNumber: row.registerNumber.trim(),
          phoneNumber: row.phoneNumber.trim(),
          hasVoted: false, // Default for new voters
        };
        // Type assertion to help TypeScript, assuming your CSV matches structure for VoterDocument creation
        votersToSeed.push(voterData as unknown as VoterDocument);
      })
      .on('end', async () => {
        console.log(`🏁 CSV file successfully processed. ${rowCount} rows read, ${skippedCount} rows skipped.`);
        
        if (votersToSeed.length > 0) {
          console.log(`🌱 Attempting to seed ${votersToSeed.length} voters into the database...`);
          try {
            // Using insertMany for efficiency, but it might not trigger 'save' hooks if you have complex ones.
            // For simple data like this and if 'unique' constraint on aadhaarNumber handles duplicates, it's fine.
            // If aadhaarNumber isn't unique in CSV but should be in DB, insertMany might fail for duplicates.
            // A more robust way for duplicates is to upsert one by one or check existence first.
            
            // For now, simple insertMany. Mongoose will throw error on duplicate unique key (aadharNumber)
            await Voter.insertMany(votersToSeed, { ordered: false }); // ordered: false allows valid ones to insert even if some fail
            importedCount = votersToSeed.length; // Assume all succeed if no error, or count successes better in real app
            console.log(`✅ Successfully seeded ${importedCount} voters (potential duplicates based on unique key might have been skipped by MongoDB).`);
          } catch (dbError: any) {
            // Handle bulk write errors (e.g., duplicate keys)
            if (dbError.writeErrors && dbError.writeErrors.length > 0) {
                const successfulInserts = dbError.result?.nInserted || 0;
                const duplicateKeyErrors = dbError.writeErrors.filter((e: any) => e.err.code === 11000).length;
                console.warn(`⚠️ Some voters could not be seeded due to errors (e.g., duplicate Aadhaar numbers).`);
                console.warn(`   Successfully inserted: ${successfulInserts}`);
                console.warn(`   Duplicate key errors (skipped): ${duplicateKeyErrors}`);
                importedCount = successfulInserts;
            } else {
                console.error('❌ Error seeding voters to database:', dbError.message);
            }
          }
        } else {
          console.log('ℹ️ No valid voters found in CSV to seed.');
        }
        
        await mongoose.disconnect();
        console.log('🔒 MongoDB disconnected.');
        process.exit(0);
      })
      .on('error', (streamError) => {
        console.error('❌ Error reading CSV stream:', streamError);
        mongoose.disconnect();
        process.exit(1);
      });

  } catch (error) {
    const e = error as Error;
    console.error('❌ Failed to connect to MongoDB or other setup error:', e.message);
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        console.log('🔒 MongoDB disconnected due to error.');
    }
    process.exit(1);
  }
}

seedVotersFromCsv();