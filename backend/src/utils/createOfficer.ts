import dotenv from 'dotenv';
import path from 'path'; // path is used for path.resolve
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import minimist from 'minimist';
import { Officer, OfficerDocument } from '../models/Officer'; // Adjusted path to be relative to src/utils/

// --- Determine the correct path to the .env file ---
// The script is in backend/src/utils/
// If .env is in backend/, we need to go up two directories from __dirname
const dotEnvPath = path.resolve(__dirname, '../../.env'); 
dotenv.config({ path: dotEnvPath });

// For debugging:
console.log(`Attempting to load .env file from: ${dotEnvPath}`);
console.log('MONGO_URI from process.env after config:', process.env.MONGO_URI);

// Interface for the data used to create an officer
interface OfficerCreationData {
  officerId: string;
  name: string;
  email: string;
  password?: string; // This will be the hashed password
  role?: string;
  boothNumber?: string;
}

const showUsage = () => {
  console.log(`
  Creates a new polling officer in the database.

  Usage:
    npm run create:officer -- --officerId <id> --name "<full name>" --email <email> [--password <password>] [--boothNumber <booth>] [--role <role>]

  Options:
    --officerId   Required: The unique ID for the officer (e.g., OFF001).
    --name        Required: The full name of the officer (e.g., "Ravi Kumar").
    --email       Required: The email address for the officer (must be unique).
    --password    Optional: The password for the officer. Defaults to "password123".
    --boothNumber Optional: The booth number assigned to the officer.
    --role        Optional: The role of the officer (e.g., "Presiding Officer", "Polling Officer"). Defaults to "Polling Officer".
    --help        Show this help message.

  Example:
    npm run create:officer -- --officerId TRN001 --name "John Doe" --email john.doe@example.com --password "securePassword" --boothNumber B001 --role "Presiding Officer"
  `);
  process.exit(0);
};

const createOfficerScript = async () => {
  const args = minimist(process.argv.slice(2));

  if (args.help) {
    showUsage();
  }

  const {
    officerId,
    name,
    email,
    password: plainPassword = 'password123',
    boothNumber, 
    role = 'Polling Officer',
  } = args;

  if (typeof officerId !== 'string' || typeof name !== 'string' || typeof email !== 'string') {
    console.error('❌ Error: --officerId, --name, and --email must be strings and are required.');
    showUsage();
    return;
  }
  if (typeof plainPassword !== 'string') {
    console.error('❌ Error: --password must be a string.');
    showUsage();
    return;
  }
  if (boothNumber !== undefined && typeof boothNumber !== 'string' && typeof boothNumber !== 'number') {
    console.error('❌ Error: --boothNumber must be a string or number if provided.');
    showUsage();
    return;
  }
  if (typeof role !== 'string') {
    console.error('❌ Error: --role must be a string.');
    showUsage();
    return;
  }

  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in your .env file or was not loaded.');
    console.error(`   (dotenv tried to load from: ${dotEnvPath})`);
    console.error('   Please ensure your .env file exists at this location and MONGO_URI is correctly set within it.');
    process.exit(1);
  }

  let exitCode = 0; 

  try {
    console.log(`🔄 Connecting to MongoDB using URI: ${process.env.MONGO_URI.substring(0,20)}...`); // Log partial URI for security
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected.');

    const existingOfficerById = await Officer.findOne({ officerId });
    if (existingOfficerById) {
      console.error(`❌ Error: Officer with officerId "${officerId}" already exists:`);
      console.log(JSON.stringify(existingOfficerById.toObject(), null, 2));
      exitCode = 1;
      return; 
    }

    const existingOfficerByEmail = await Officer.findOne({ email });
    if (existingOfficerByEmail) {
      console.error(`❌ Error: Officer with email "${email}" already exists:`);
      console.log(JSON.stringify(existingOfficerByEmail.toObject(), null, 2));
      exitCode = 1;
      return; 
    }

    console.log(`🔄 Hashing password for officer: ${name}...`);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const officerData: OfficerCreationData = {
      officerId,
      name,
      email,
      password: hashedPassword,
      role,
    };

    if (boothNumber !== undefined) {
      officerData.boothNumber = String(boothNumber); 
    }
    
    console.log(`📝 Creating new officer with details:
      Officer ID: ${officerData.officerId}
      Name: ${officerData.name}
      Email: ${officerData.email}
      Role: ${officerData.role}
      Booth Number: ${officerData.boothNumber || 'N/A'}
    `);

    const newOfficer = new Officer(officerData);
    await newOfficer.save();

    console.log('✅ Officer created successfully:');
    console.log(JSON.stringify(newOfficer.toObject(), null, 2));

  } catch (error) {
    exitCode = 1;
    if (error instanceof Error) {
        console.error('❌ Error creating officer:', error.message);
        if (error.stack) {
            // console.error(error.stack); //  Can be too verbose, uncomment if needed
        }
    } else {
        console.error('❌ An unknown error occurred while creating officer:', error);
    }
  } finally {
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) { // 1 === connected, 2 === connecting
        console.log('⬇️ Disconnecting from MongoDB...');
        await mongoose.disconnect();
        console.log('🚪 MongoDB Disconnected.');
    }
    process.exit(exitCode); 
  }
};

createOfficerScript();