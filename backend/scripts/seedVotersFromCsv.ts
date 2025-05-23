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
  voterIdNumber: string; // Added
  registerNumber: string;
  phoneNumber: string;
}

async function seedVotersFromCsv() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI not found in .env file. Make sure it is in backend/.env');
    process.exit(1);
  }

  const csvFilePath = path.resolve(__dirname, 'voter_data.csv');

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found at: ${csvFilePath}`);
    console.log('Please create a voter_data.csv file in the backend/scripts/ directory with columns:');
    console.log('fullName,dob,address,photoUrl,aadharNumber,voterIdNumber,registerNumber,phoneNumber');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected for seeding.');

    const shouldClearCollection = process.argv.includes('--clear');
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

        const voterData = {
          fullName: row.fullName?.trim(),
          dob: row.dob?.trim(),
          address: row.address?.trim(),
          photoUrl: row.photoUrl?.trim() || undefined,
          aadharNumber: row.aadharNumber?.trim() || undefined,
          voterIdNumber: row.voterIdNumber?.trim() || undefined,
          registerNumber: row.registerNumber?.trim() || undefined,
          phoneNumber: row.phoneNumber?.trim(),
          hasVoted: false,
        };

        // Validate core required fields
        if (!voterData.fullName || !voterData.dob || !voterData.address || !voterData.phoneNumber) {
          console.warn(`⚠️ Skipping row ${rowCount}: Missing core fields (fullName, dob, address, phoneNumber). Data:`, row);
          skippedCount++;
          return;
        }

        // Ensure at least one identifier is present
        if (!voterData.aadharNumber && !voterData.voterIdNumber && !voterData.registerNumber) {
          console.warn(`⚠️ Skipping row ${rowCount}: At least one identifier (Aadhaar, VoterID, RegisterNo) must be present. Data:`, row);
          skippedCount++;
          return;
        }

        votersToSeed.push(voterData as unknown as VoterDocument);
      })
      .on('end', async () => {
        console.log(`🏁 CSV file successfully processed. ${rowCount} rows read, ${skippedCount} rows skipped.`);

        if (votersToSeed.length > 0) {
          console.log(`🌱 Attempting to seed ${votersToSeed.length} voters into the database...`);
          try {
            await Voter.insertMany(votersToSeed, { ordered: false });
            importedCount = votersToSeed.length;
            console.log(`✅ Successfully seeded ${importedCount} voters (potential duplicates based on unique key might have been skipped by MongoDB).`);
          } catch (dbError: any) {
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
