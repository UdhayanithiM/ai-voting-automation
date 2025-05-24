import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Voter, VoterDocument } from '../src/models/Voter';

// Load environment variables
// Make SURE this path is correct for your .env file location
// If .env is in ai-voting-automation/.env:
//dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// If .env is in ai-voting-automation/backend/.env:
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('MONGO_URI from process.env:', process.env.MONGO_URI); // DEBUG

interface CsvRow {
  fullName: string;
  dob: string;
  address: string;
  photoUrl: string;
  aadharNumber: string;
  voterIdNumber: string;
  registerNumber: string;
  phoneNumber: string;
}

async function seedVotersFromCsv() {
  const mongoUri = process.env.MONGO_URI_TEST || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI or MONGO_URI_TEST not found in .env file.');
    process.exit(1);
  }

  const csvFilePath = path.resolve(__dirname, 'voter_data.csv');

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found at: ${csvFilePath}`);
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected for seeding.');

    console.log('🗑️ Clearing existing voters from the collection...');
    await Voter.deleteMany({});
    console.log('✅ Voters collection cleared.');

    const votersToSeed: Partial<VoterDocument>[] = [];
    let rowCount = 0;
    let skippedCount = 0;

    console.log(`📄 Reading data from ${csvFilePath}...`);

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (row: CsvRow) => {
          rowCount++;

          // --- Start Debug Block ---
          console.log(`\n--- Processing CSV Row ${rowCount} ---`);
          console.log('Raw CSV row data:', JSON.stringify(row));
          const rawVoterIdFromCsv = row.voterIdNumber;
          const trimmedVoterId = rawVoterIdFromCsv?.trim();
          const finalVoterIdForDb = trimmedVoterId || undefined;
          console.log(`Raw voterIdNumber from CSV: "${rawVoterIdFromCsv}"`);
          console.log(`Trimmed voterIdNumber: "${trimmedVoterId}"`);
          console.log(`Final voterIdNumber to be used: "${finalVoterIdForDb}"`);
          // --- End Debug Block ---

          const voterData: Partial<VoterDocument> = {
            fullName: row.fullName?.trim(),
            dob: row.dob?.trim(),
            address: row.address?.trim(),
            photoUrl: row.photoUrl?.trim() || undefined,
            aadharNumber: row.aadharNumber?.trim() || undefined,
            voterIdNumber: finalVoterIdForDb, // Using the debugged value
            registerNumber: row.registerNumber?.trim() || undefined,
            phoneNumber: row.phoneNumber?.trim().replace(/\s+/g, ''),
            hasVoted: false,
          };

          if (!voterData.fullName || !voterData.dob || !voterData.phoneNumber) {
            console.warn(`⚠️ SKIPPING row ${rowCount} (MISSING CORE FIELDS): Missing fullName, dob, or phoneNumber. Data:`, JSON.stringify(row));
            skippedCount++;
            return;
          }

          if (!voterData.aadharNumber && !voterData.voterIdNumber && !voterData.registerNumber) {
            console.warn(`⚠️ SKIPPING row ${rowCount} (NO IDENTIFIER): At least one identifier (Aadhaar, VoterID, RegisterNo) must be present. Data:`, JSON.stringify(row));
            skippedCount++;
            return;
          }
          console.log('Prepared voterData for this row:', JSON.stringify(voterData));
          votersToSeed.push(voterData);
        })
        .on('end', () => {
          console.log(`\n🏁 CSV file successfully processed. ${rowCount} rows read, ${skippedCount} rows skipped.`);
          resolve();
        })
        .on('error', (streamError) => {
          console.error('❌ Error reading CSV stream:', streamError);
          reject(streamError);
        });
    });

    // --- Debug: Print all voterIdNumbers about to be inserted ---
    console.log('\n--- Voter ID Numbers prepared for insertMany ---');
    votersToSeed.forEach((voter, index) => {
        console.log(`Voter ${index + 1} (${voter.fullName}): voterIdNumber = "${voter.voterIdNumber}" (Type: ${typeof voter.voterIdNumber})`);
    });
    console.log('------------------------------------------------');
    // --- End Debug ---

    if (votersToSeed.length > 0) {
      console.log(`🌱 Attempting to seed ${votersToSeed.length} voters into the database...`);
      try {
        const result = await Voter.insertMany(votersToSeed, { ordered: false });
        console.log(`✅ Successfully inserted ${result.length} voters.`);
         if (result.length !== votersToSeed.length) {
            const errors = votersToSeed.length - result.length;
            console.warn(`⚠️ Attempted to insert ${votersToSeed.length} but only ${result.length} were successful (${errors} errors).`);
        }
      } catch (dbError: any) {
        console.error('❌ Error inserting voters into database:');
        if (dbError.writeErrors && dbError.writeErrors.length > 0) {
          const successfulInserts = dbError.result?.nInserted || (votersToSeed.length - dbError.writeErrors.length);
          const duplicateKeyErrors = dbError.writeErrors.filter((e: any) => e.code === 11000 || e.err?.code === 11000).length;
          console.warn(`   Successfully inserted (estimated): ${successfulInserts}`);
          console.warn(`   Duplicate key errors (within CSV or other unique constraint violations): ${duplicateKeyErrors}`);
          dbError.writeErrors.forEach((e: any) => console.error(`     - Error detail: ${e.errmsg || e.err?.errmsg}`));
        } else {
          console.error(dbError.message || 'An unexpected error occurred during database insertion.');
        }
      }
    } else {
      console.log('ℹ️ No valid voters found in CSV to seed (after skipping).');
    }

  } catch (error) {
    const e = error as Error;
    console.error('❌ Top-level error during seeding process or DB connection:', e.message, e.stack);
  } finally {
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      await mongoose.disconnect();
      console.log('🔒 MongoDB disconnected.');
    }
  }
}

seedVotersFromCsv().catch(err => {
  console.error("❗ Seeding script failed with an unhandled error:", err);
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    mongoose.disconnect().finally(() => process.exit(1));
  } else {
    process.exit(1);
  }
});